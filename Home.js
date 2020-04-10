// Ideas:
//      Notification if all results for search query are closed, line 186
// #SPEED: places to potentially improve speed
// FIX:
//   - ALERT: If start/end not specific addresses

import MAPS_API_KEY from './api-key'
import React, { Component } from 'react';
import { Container, Header, Left, Body, Right, Title, Content, 
    Text, Form, Item, Label, Input, Button, Icon, Grid, Col, Root, ActionSheet,
    CheckBox, Toast, ListItem,
    Row} from 'native-base';
import { View, StyleSheet, Animated} from 'react-native'
import { generateAPIUrl, permutator, generatePathUrl, generatePlaceAutocompleteUrl, 
    PLACE_TEXT, STARTING_PLACE_TEXT, ENDING_PLACE_TEXT, generateGeneralSearchURL, setStateAsync } from './const';
import { Linking } from 'expo';
import DraggableFlatList from "react-native-draggable-flatlist";
import Autocomplete from 'native-base-autocomplete';
import Geocode from "react-geocode";
import { add, max } from 'react-native-reanimated';
import { withOrientation } from 'react-navigation';
import { Overlay } from 'react-native-elements';
import * as Progress from 'react-native-progress';

Geocode.setApiKey(MAPS_API_KEY);

var BUTTONS = ["Apple Maps", "Google Maps", "Waze", "Cancel"];
var CANCEL_INDEX = 3;
var MAX_GENERAL_RESULTS = 4;

const styles = StyleSheet.create({
    autocompleteContainer: {
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1
      },
    container: {
        flexDirection: 'row',
        height: 100,
        padding: 20,
        justifyContent: "space-between",
    },
    innerContainer: {
        flexDirection: 'row',
        paddingTop: 20,
        paddingBottom: 20,
        justifyContent: "space-evenly",
    },
    title: {
        fontSize: 44,
        fontWeight: "400",
        textAlign: "center"
    },
    subtitle: {
        fontStyle: "italic",
        fontWeight: "300",
        textAlign: "center"
    },
    header: {
        fontSize: 32,
        fontWeight: "400"
    },
    explanationText: {
        textAlign: "center"
    },
    text: {
        textAlign: "center"
    },
    titleBlock: {
        paddingTop: 50,
        paddingBottom: 30,
    },
    input: {
        borderColor: "lightgrey",
        borderRadius: 20,
        borderStyle: "solid",
        borderWidth: 1,
        margin: 10,
        paddingBottom: 10,
    }
})

const showToast = (description, button) => {
    Toast.show({
        text: description,
        buttonText: button
      })
}

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            returnBackHome: false,
            destinations: ["", ""], // initializes three empty places
            allDestinations: ["", ""], // used for distance matrix calc
            permDestinations: [], // list of [address, type] pairs to accomodate general queries. type = 0 for specific addres, type = 1+ for general address
            matrixDestinations: [], // list of all possible destinations including all general search results,
            lockedPlaces: [false, false], // needs to be same size as list
            autocomplete: [],
            currentAddress: "",
            currentCoords: "",
            autocompleteOverlayVisible: false, // the overlay for autocomplete modal
            autocompletePos: 0, // the pos of the destination we are editing via autocomplete
            autocompleteFadeValue: new Animated.Value(0),
            computing: false,
            computingProgress: 0
        };
        this.addPlace = this.addPlace.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.endEqualsStart = this.endEqualsStart.bind(this);
        this.endRouteStyling = this.endRouteStyling.bind(this);
        this.lockPlaceStyling = this.lockPlaceStyling.bind(this);
    }

    setStateAsync(state) {
        return new Promise((resolve, reject) => {
            this.setState(state, resolve, reject)
        });
    }

    componentDidMount() {
        this.setCurrentLocation();
    }

    setCurrentLocation() {
        let destinations = this.state.destinations.slice();

        let getPosition = function () {
            var options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            return new Promise(function (resolve, reject) {
              navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };
          
        getPosition()
            .then((pos) => {
                this.setState({currentCoords : pos.coords.latitude + "," + pos.coords.longitude});
                Geocode.fromLatLng(pos.coords.latitude, pos.coords.longitude).then(
                    response => {
                        let street = response.results[0].address_components[0].short_name + " " + response.results[0].address_components[1].short_name;
                        let city = response.results[0].address_components[3].short_name;
                        let address = street + " " + city;
                        this.setState({currentAddress : address});
                        destinations[0] = address;
                        this.setState({ destinations });
                        console.log("Current location retrieved successfully and set\nAddress: " + address);
                    },
                    error => {
                        console.log(error);
                    }
                );
            })
            .catch((err) => {
                console.log(err.message);
        });
    }

    // determines startpoint coordinates, then calls getGeneralLocations
    async getGeneralLocations() {
        let start_coords = this.state.currentCoords;
        let start = this.state.destinations[0];

        // if user changed start from current location
        // set start_coords to coordinates of the specified start address
        if (start != this.state.currentAddress) {
            let result = await Geocode.fromAddress(start);
            let lat = result["results"][0]["geometry"]["location"]["lat"];
            let long = result["results"][0]["geometry"]["location"]["lng"];
            start_coords = lat + "," + long;
        }

        // console.log("CURRENT ADDRESS\n" + this.state.currentAddress); 

        // iterates through destinations excluding start and end, if destination does not have a number consider it general query
        // url request returns places that match query within ~20 miles (30000 meters) 
        // of either the specific start address
        console.log("STARTING GENERAL SEARCH");
        
        let type = 1;
        let numSearch = this.state.allDestinations.length - 2;
        let matrixDestinations = [start];
        let permDestinations = [];

        // if end != start, add end as well
        let end = this.state.allDestinations[this.state.allDestinations.length - 1];
        if (start != end) {
            matrixDestinations.push(end);
        }

        // generate permDests and matrixDests
        for (let i = 1; i < this.state.allDestinations.length - 1; i++) {     
            // console.log("entered loop");       

            // if dest has number, then its specific
            if (/\d/.test(this.state.allDestinations[i])) {                
                // add to matrixDestinations as is
                matrixDestinations.push(this.state.allDestinations[i]);

                // add to permDestinations with type = 0 because its specific
                permDestinations.push([this.state.allDestinations[i], 0]);
            
                // else general query
            } else {
                let query = this.state.allDestinations[i];
                let url = generateGeneralSearchURL(query, start_coords);
                console.log("QUERY:\n" + query);
                                                

                // url request returns places matching general text search
                let response = await fetch(url);                
                let data = await response.json();
                // console.log(data);

                let results = data["results"];
                // FIX: if results lenght is zero display error
                let numResults = Math.min(MAX_GENERAL_RESULTS, results.length);
                
                // arbitrarily set to 3 closest to minimize runtime
                for (let i = 0; i < numResults; i++) {
                    let hasHours = results[i].hasOwnProperty('opening_hours');
                    if ((hasHours && results[i]["opening_hours"]["open_now"]) || !hasHours) {
                        // add address to matrix destations                        
                        matrixDestinations.push(results[i]["formatted_address"]);
                        // add [address, type] to permDests
                        permDestinations.push([results[i]["formatted_address"], type]);
                    }   
                }
                type++;
            }
        } 
        return [numSearch, matrixDestinations, permDestinations];
    }

    getDurationFromPath(distanceMatrix, matrixDestinations, path) {
        var duration = 0;        

        // iterating through all the sequential pairs
        for (let i = 0; i < path.length - 1; i++) {
            let firstPoint = matrixDestinations.indexOf(path[i]);
            let secondPoint = matrixDestinations.indexOf(path[i + 1]);            
            let thisDuration = distanceMatrix[firstPoint]["elements"][secondPoint]["duration"]["value"];

            duration += thisDuration;
        }
        return duration
    }

    bruteForceShortestPath(distanceMatrix, numSearch, matrixDestinations, permDestinations) {
        let startingDestination = this.state.allDestinations[0];
        let endingDestination = this.state.allDestinations[this.state.allDestinations.length - 1];
        
        let permutations = permutator(permDestinations, numSearch); 
        // console.log("PERMUTATIONS:");
        // console.log(permutations);        

        let minDuration = Number.MAX_SAFE_INTEGER;
        let minPath = [];

        const progressIncr = 1 / permutations.length;

        permutations.forEach(perm => {
            var path = perm
            path.unshift(startingDestination)
            path.push(endingDestination)

            let pathDuration = this.getDurationFromPath(distanceMatrix, matrixDestinations, path)
            // console.log(path.join(" ==> ") + " total distance: " + pathDuration)

            if (pathDuration < minDuration) {
                minDuration = pathDuration
                minPath = path
            }

            this.setState({computingProgress: this.state.computingProgress += progressIncr})
        })

        // console.log("TOTAL SHORTEST PATH")
        // console.log(minPath.join(" ==> "))
        // console.log(minDuration)

        let origin = minPath[0]
        let waypoints = minPath.slice(1, minPath.length - 1)
        let destination = minPath[minPath.length - 1]

        let pathUrl = generatePathUrl(origin, waypoints, destination)
        console.log(pathUrl)

        let applePathUrl = "http://maps.apple.com/?daddr=" + waypoints[0].split(" ").join("+")

        ActionSheet.show(
            {
                options: BUTTONS,
                cancelButtonIndex: CANCEL_INDEX,
                title: "Shortest path generated! Choose an app to open in"
            },
            buttonIndex => {
                // console.log(pathUrl)
                if (BUTTONS[buttonIndex] == "Google Maps") {
                    Linking.openURL(pathUrl).catch((err) => console.error('An error occurred', err));
                } else if (BUTTONS[buttonIndex] == "Apple Maps") {
                    console.log(applePathUrl)
                    Linking.openURL(applePathUrl).catch((err) => console.error('An error occurred', err));
                }
                this.setState({ clicked: BUTTONS[buttonIndex] });
            }
        )
    }

    // calls distance matrix API with allDestinations
    getAllDistances() {
        console.log("ALL DESTINATIONS:\n" + this.state.allDestinations);
        
        // find specific addresses for general queries
        this.getGeneralLocations().then((result) => {
            console.log('GETTING GENERAL RESULTS FINISHED');

            let numSearch = result[0];
            let matrixDestinations = result[1];
            let permDestinations = result[2];

            // console.log("\nmatrix destinations:");
            // matrixDestinations.forEach(el => console.log(el));

            // console.log("\nperm destinations:\n");
            // permDestinations.forEach(el => console.log(el));
    
            
            // uses matrixDestinations to return matrix of all distances between all possibilities
            let url = generateAPIUrl(matrixDestinations);
            console.log(url);
            

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    //let allDestinations = data["destination_addresses"]
                    //this.setState({ allDestinations })
                    // here we update the allDestinations in the state
                    // this replaces the generic names we type in with the specific addresses
                    // for example, Washington gets replaced with Washington, USA
                    // if we don't want the user interface to change, we can replace this with
                    // a different variable no problem
                    
                    let distanceMatrix = data["rows"]
                    this.bruteForceShortestPath(distanceMatrix, numSearch, matrixDestinations, permDestinations)
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
    }

    autocompleteText(text) {
        let query = text
        let url = generatePlaceAutocompleteUrl(query)
        // console.log(url)

        fetch(url)
            .then(response => response.json())
            .then(data => {
                let autocomplete = data["predictions"].map(pred => pred.description)
                console.log(autocomplete)
                this.setState({ autocomplete })
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    onPlaceChange(event, pos) {
        let destinations = this.state.destinations
        //destination[pos] = text
        destinations[pos] = event.nativeEvent.text

        if (this.state.returnBackHome && pos === 0) {
            destinations[destinations.length - 1] = destinations[0];
        }

        this.setState({ destinations })
        console.log(destinations)
    }

    onPlaceChangeText(text, pos) {
        console.log("YUh")
        var destinations = this.state.destinations
        destinations[pos] = text
        this.autocompleteText(text)
        //destinations[pos] = event.nativeEvent.text
        this.setState({ destinations })
    }

    onAutocompleteSelect(sugg, pos) {
        console.log(pos)
        // we want to wipe autocompelete as well
        let autocomplete = []

        var destinations = this.state.destinations
        destinations[pos] = sugg
        this.setState({ 
            destinations, 
            autocomplete,
            autocompleteOverlayVisible: false   // hide the modal
        })
    }

    addPlace() {
        var destinations = this.state.destinations
        let endDest = destinations[destinations.length - 1]
        destinations.pop()
        destinations.push("")
        destinations.push(endDest)
        this.setState({ destinations })
        // add value for lockPlace tracking
        this.state.lockedPlaces.push(false)

        this.setState({
            autocompleteOverlayVisible: true,
            autocompletePos: destinations.length - 2
        })
    }

    // deletes either empty space or one with name
    deletePlace(pos) {
        var self = this;
        var destinations = this.state.destinations

        if (destinations.length <= 2) {
            showToast("You can't have less than 2 locations!", "Okay")
            return
        }

        destinations.splice(pos, 1)
        this.setState({ destinations })

        // delete for lockPlace tracking
        var locks = this.state.lockedPlaces
        locks.splice(pos, 1)
        this.setState({ locks })
    }

    
    onSubmit() {
        this.setState({computing: true}) 
        // filter out all of the empty destinations
        let filteredDestinations = this.state.destinations.filter(destination => destination.length > 0);
        let allDestinations = filteredDestinations;

        this.setState({ allDestinations }, () => this.getAllDistances()); // for distance matrix stuff
    }
    
    // populates final destination with starting destination at index 0 
    endEqualsStart() {    
        let destinations = this.state.destinations.slice();
       
        this.setState(prevState => ({returnBackHome: !prevState.returnBackHome}), () => {
            if (this.state.returnBackHome) {
                destinations[destinations.length - 1] = destinations[0];
            } else {
                destinations[destinations.length - 1] = "";
            }
            this.setState({ destinations }); 
        });
    }

    endRouteStyling(pos) {
        if (pos === this.state.destinations.length - 1 && this.state.returnBackHome) {
            return {
                backgroundColor:'grey',
                disabled: 'true',
                opacity: .5
            }
        } else {
            return "";
        }
        
    }

    // need to lock location in algo for routing
    lockPlace(pos) {
        if (pos === 0) {
            return
        }
        let lockedPlaces = this.state.lockedPlaces;
        lockedPlaces[pos] = !lockedPlaces[pos];
        this.setState({ lockedPlaces });
    }

    lockPlaceStyling(pos) {
        if (this.state.lockedPlaces[pos] === true && pos < this.state.destinations.length - 1 && pos > 0 ) {
            return {
                backgroundColor:'grey',
                disabled: 'true',
                opacity: .5
            }
        } else {
            return "";
        }
    }

    _start() {
        this.setState({autocompleteFadeValue: new Animated.Value(0)}, () => {
            Animated.timing(this.state.autocompleteFadeValue, {
                toValue: 1,
                duration: 1000
              }).start();
        })
      };

    renderAutocomplete() {
        return (
            <Overlay 
                overlayStyle={{opacity: 1}}
                isVisible={this.state.autocompleteOverlayVisible}
                onBackdropPress={() => this.setState({ autocompleteOverlayVisible: false })}
            >

            <ListItem
                onPress={() => (	
                    this.onAutocompleteSelect(this.state.destinations[this.state.autocompletePos], this.state.autocompletePos)	
                )}	
                >	
                <Text>Find best location</Text>	
            </ListItem>	

            <Autocomplete	
                autoCorrect={false}	
                data={this.state.autocomplete}	
                defaultValue={this.state.destinations[this.state.autocompletePos]}	
                onChangeText={text => this.onPlaceChangeText(text, this.state.autocompletePos)}
                placeholder="Enter place"	
                renderItem={sugg => 
                    <ListItem
                        onPress={() => (	
                            this.onAutocompleteSelect(sugg, this.state.autocompletePos)	
                        )}	
                        >	
                        <Text>{sugg}</Text>	
                    </ListItem>}	
            />	
        </Overlay>
        )
    }

    render() {
        return (
            <Root>
                <View style={styles.container}>
                    <Container>
                        <Content>
                            <View style={styles.titleBlock}>
                                <Text style={styles.title}>
                                    Cutting Corners
                                </Text>
                                <Text style={styles.subtitle}>
                                    Find the quickest path between all your daily stops
                                </Text>
                            </View>
                            <Form >
                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.returnBackHome} onPress={this.endEqualsStart} />
                                    <Text>End your route at the starting point</Text>
                                </View>

                                {this.renderAutocomplete()}

                                {this.state.destinations.slice(0, -1).map((destinationName, pos) => 
                                
                                    <Grid>
                                        <Col>
                                            <Item floatingLabel>
                                                <Label style={{padding: 20,}} class="active">{pos == 0 ? STARTING_PLACE_TEXT : pos < this.state.destinations.length - 1 ? PLACE_TEXT + " " + (pos) : ENDING_PLACE_TEXT}</Label>
                                                <Input {...this.lockPlaceStyling(pos)} value={destinationName} onChange={(event) => this.onPlaceChange(event, pos)}/>
                                            </Item>
                                        </Col>
                                        <Col style={{width: "15%", top: 25}}>
                                            <Button iconLeft transparent onPress={() => this.lockPlace(pos)}>
                                                <Icon type='AntDesign' name='lock'/>
                                            </Button>
                                        </Col>
                                        <Col style={{width: "15%", top: 25}}>
                                            <Button iconLeft transparent onPress={() => this.deletePlace(pos)}>
                                                <Icon type='AntDesign' name='delete'/>
                                            </Button>
                                        </Col>
                                    </Grid>
                                )}
                                <View style={styles.innerContainer} >
                                    <Button iconLeft onPress={this.addPlace}> 
                                        <Icon name='add' />
                                        <Text>Add a stop</Text>
                                    </Button>
                                </View>
                               
                            </Form>

                            <Form>
                                <Grid style={styles.input}> 
                                        <Col>
                                            <Item floatingLabel>
                                                <Label style={{padding: 20,}} class="active">{ENDING_PLACE_TEXT}</Label>
                                                <Input {...this.endRouteStyling(this.state.destinations.length - 1)} value={this.state.destinations.slice(-1)[0]} onChange={(event) => this.onPlaceChange(event, this.state.destinations.length - 1)}/>
                                            </Item>
                                        </Col>
                                        <Col style={{width: "15%", top: 25}}>
                                            <Button iconLeft transparent >
                                                <Icon type='AntDesign' name='lock'/>
                                            </Button>
                                        </Col>
                                        <Col style={{width: "15%", top: 25}}>
                                            <Button iconLeft transparent onPress={() => this.deletePlace(this.state.destinations.length)}>
                                                <Icon type='AntDesign' name='delete'/>
                                            </Button>
                                        </Col>
                                    </Grid>
                            </Form>
                            <View style={styles.innerContainer}>
                                <Button iconLeft  
                                    onPress={this.onSubmit}>
                                    <Icon name='search' />
                                    <Text>Find Shortest Path</Text>
                                </Button>
                            </View>
                            {this.state.computing ? 
                                <View style={styles.innerContainer}>
                                    <Text>Computing...</Text>
                                    <Progress.Bar progress={this.state.computingProgress} width={200} />
                                </View>
                            : null
                            }
                        </Content>
                    </Container>
                </View>
            </Root>
        );
    }
}