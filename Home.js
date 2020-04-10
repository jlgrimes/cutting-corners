// Ideas:
//      Notification if all results for search query are closed, line 186
// #SPEED: places to potentially improve speed

import MAPS_API_KEY from './api-key'
import React, { Component } from 'react';
import { Container, Header, Left, Body, Right, Title, Content, 
    Text, Form, Item, Label, Input, Button, Icon, Grid, Col, Root, ActionSheet,
    CheckBox, Toast,
    Row} from 'native-base';
import { View, StyleSheet, ListItem } from 'react-native'
import { generateAPIUrl, permutator, generatePathUrl, generatePlaceAutocompleteUrl, 
    PLACE_TEXT, STARTING_PLACE_TEXT, ENDING_PLACE_TEXT, generateGeneralSearchURL } from './const';
import { Linking } from 'expo';
import DraggableFlatList from "react-native-draggable-flatlist";
import { Autocomplete } from 'native-base-autocomplete';
import Geocode from "react-geocode";
import { add } from 'react-native-reanimated';
import { withOrientation } from 'react-navigation';
Geocode.setApiKey(MAPS_API_KEY);

var BUTTONS = ["Apple Maps", "Google Maps", "Waze", "Cancel"];
var CANCEL_INDEX = 3;
let CURRENT_ADDRESS = "";
let CURRENT_COORDS = "42.2745128,-83.7355595";

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 100,
        padding: 20,
        justifyContent: "space-between"
    },
    innerContainer: {
        flexDirection: 'row',
        paddingTop: 20,
        justifyContent: "space-evenly"
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
            // startAtCurrentLocation: false,
            destinations: ["", "", "", "", ""], // initializes three empty places
            allDestinations: ["", "", "", "", ""], // used for distance matrix calc
            autocomplete: [],
            permDestinations: [], // list of [address, type] pairs to accomodate general queries. type = 0 for specific addres, type = 1+ for general address
            matrixDestinations: [] // list of all possible destinations including all general search results
        };
        this.addPlace = this.addPlace.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.endEqualsStart = this.endEqualsStart.bind(this);
        this.endRouteStyling = this.endRouteStyling.bind(this);
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
                CURRENT_COORDS = pos.coords.latitude + "," + pos.coords.longitude;
                Geocode.fromLatLng(pos.coords.latitude, pos.coords.longitude).then(
                    response => {
                        let street = response.results[0].address_components[0].short_name + " " + response.results[0].address_components[1].short_name;
                        let city = response.results[0].address_components[3].short_name;
                        let address = street + " " + city;
                        CURRENT_ADDRESS = address;
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
        let start_coords = CURRENT_COORDS;
        let start = this.state.destinations[0];

        // if user changed start from current location
        // set start_coords to coordinates of the specified start address
        if (start != CURRENT_ADDRESS) {
            let result = await Geocode.fromAddress(start);
            let lat = result["results"][0]["geometry"]["location"]["lat"];
            let long = result["results"][0]["geometry"]["location"]["lng"];
            start_coords = lat + "," + long;
        }

        // iterates through destinations excluding start and end, if destination does not have a number consider it general query
        // url request returns places that match query within ~20 miles (30000 meters) 
        // of either the specific start address
        console.log("STARTING GENERAL SEARCH");
        
        let type = 1;
        let numSearch = this.state.allDestinations.length - 2;

        // add start to matrixDestinations to be sent to API
        this.setState(prevState => ({
            matrixDestinations: [...prevState.matrixDestinations, start]
        }));

        // if end != start, add end as well
        let end = this.state.allDestinations[this.state.allDestinations.length - 1];
        if (start != end) {
            this.setState(prevState => ({
                matrixDestinations: [...prevState.matrixDestinations, end]
            }));
        }

        // generate permDests and matrixDests
        for (let i = 1; i < this.state.allDestinations.length - 1; i++) {            

            // if dest has number, then its specific
            if (/\d/.test(this.state.allDestinations[i])) {
                // add to matrixDestinations as is
                this.setState(prevState => ({
                    matrixDestinations: [...prevState.matrixDestinations, this.state.allDestinations[i]]
                }));

                // add to permDestinations with type = 0 because its specific
                this.setState(prevState => ({
                    permDestinations: [...prevState.permDestinations, [this.state.allDestinations[i], 0]]
                }));

            // else general query
            } else {
                let query = this.state.allDestinations[i];
                let url = generateGeneralSearchURL(query, start_coords);

                // url request returns places that match query within ~20 miles (30000 meters) 
                // of the starting coordinates
                let response = await fetch(url);
                let data = await response.json();
                    
                let results = data["results"];
                
                // arbitrarily set to 3 closest to minimize runtime #SPEED
                for (let i = 0; i < 3; i++) {
                    // if (results[i]["opening_hours"]["open_now"]) { #FIX: ignored for testing
                        // add address to matrix destations
                        this.setState(prevState => ({
                            matrixDestinations: [...prevState.matrixDestinations, results[i]["formatted_address"]]
                        }));
                        // add [address, type] to permDests
                        this.setState(prevState => ({
                            permDestinations: [...prevState.permDestinations, [results[i]["formatted_address"], type]]
                        }));
                    // }                    

                }
                type++;
            }
        } 
        return numSearch;
    }

    getDurationFromPath(distanceMatrix, path) {
        var duration = 0
        const { matrixDestinations } = this.state;
        

        // iterating through all the sequential pairs
        for (let i = 0; i < path.length - 1; i++) {
            let firstPoint = matrixDestinations.indexOf(path[i])
            let secondPoint = matrixDestinations.indexOf(path[i + 1])

            let thisDuration = distanceMatrix[firstPoint]["elements"][secondPoint]["duration"]["value"]
            // console.log(path[i] + "==>" + path[i + 1])
            // console.log(thisDuration)

            duration += thisDuration
        }
        return duration
    }

    bruteForceShortestPath(distanceMatrix, numSearch) {
        console.log("DISTANCE MATRIX22222: " + distanceMatrix);
        
        let startingDestination = this.state.allDestinations[0];
        let endingDestination = this.state.allDestinations[this.state.allDestinations.length - 1];
        let destinations = this.state.permDestinations.slice(1, this.state.permDestinations.length - 1);        
        
        let permutations = permutator(destinations, numSearch); 
        console.log("PERMUTATIONS:");
        console.log(permutations);        

        let minDuration = Number.MAX_SAFE_INTEGER;
        let minPath = [];

        permutations.forEach(perm => {
            var path = perm
            path.unshift(startingDestination)
            path.push(endingDestination)

            let pathDuration = this.getDurationFromPath(distanceMatrix, path)
            console.log(path.join(" ==> ") + " total distance: " + pathDuration)

            if (pathDuration < minDuration) {
                minDuration = pathDuration
                minPath = path
            }
        })

        // console.log("TOTAL SHORTEST PATH")
        // console.log(minPath.join(" ==> "))
        // console.log(minDuration)

        let origin = minPath[0]
        let waypoints = minPath.slice(1, minPath.length - 1)
        let destination = minPath[minPath.length - 1]

        let pathUrl = generatePathUrl(origin, waypoints, destination)

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
                }
                this.setState({ clicked: BUTTONS[buttonIndex] });
            }
        )
    }

    // calls distance matrix API with allDestinations
    getAllDistances() {
        console.log("ALL DESTINATIONS:\n" + this.state.allDestinations);
        
        // find specific addresses for general queries
        this.getGeneralLocations().then((numSearch) => {
            console.log('GETTING GENERAL RESULTS FINISHED');

            // uses matrixDestinations to return matrix of all distances between all possibilities
            console.log("MATRIX: " + this.state.matrixDestinations);            
            let url = generateAPIUrl(this.state.matrixDestinations);
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
                    console.log("DISTANCE MATRIX:\n" + distanceMatrix);
                    this.bruteForceShortestPath(distanceMatrix, numSearch)
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
                let autocomplete = data["predictions"]
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
        var destinations = this.state.destinations
        destination[pos] = text
        //destinations[pos] = event.nativeEvent.text
        this.setState({ destinations })
    }

    addPlace() {
        var destinations = this.state.destinations
        let endDest = destinations[destinations.length - 1]
        destinations.pop()
        destinations.push("")
        destinations.push(endDest)
        this.setState({ destinations })
    }

    // deletes either empty space or one with name
    deletePlace(pos) {
        var self = this;
        var destinations = this.state.destinations

        if (destinations.length <= 2) {
            showToast("You can't have less than 2 locations!", "Okay")
            return
        }

        // // if pos == 0
        // if (pos == 0) {

        //     // check if app is set to start at current location
        //     if (self.state.startAtCurrentLocation) {

        //         // this should, by default, uncheck the checkbox
        //         self.setState({ startAtCurrentLocation: !self.state.startAtCurrentLocation});
        //     }
        // }

        destinations.splice(pos, 1)
        this.setState({ destinations })
    }
    
    onSubmit() {        
        // filter out all of the empty destinations
        let filteredDestinations = this.state.destinations.filter(destination => destination.length > 0);
        let allDestinations = filteredDestinations;

        this.setState({permDestinations: []}, 
                      () => this.setState({matrixDestinations: []}, 
                        () => this.setState({ allDestinations }, 
                            () => this.getAllDistances())));

        // this.setState({ allDestinations }, () => this.getAllDistances()); // for distance matrix stuff
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
                            <Form>
                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.returnBackHome} onPress={this.endEqualsStart} />
                                    <Text>End your route at the starting point</Text>
                                </View>
                        
                                {this.state.destinations.map((destinationName, pos) => 
                                /*
                                <Autocomplete
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    data={this.state.autocomplete}
                                    defaultValue={destinationName}
                                    onChangeText={text => this.onPlaceChangeText(text, pos)}
                                    placeholder="Enter place"
                                    renderItem={sugg => <Item
                                        onPress={() => (
                                            this.onPlaceChangeText(sugg, pos)
                                        )}
                                        >
                                        <Text>{sugg}</Text>
                                    </Item>}
                                />
                                */
                                    <Grid>
                                        <Col>
                                            <Item floatingLabel>
                                                <Label class="active">{pos == 0 ? STARTING_PLACE_TEXT : pos < this.state.destinations.length - 1 ? PLACE_TEXT + " " + (pos) : ENDING_PLACE_TEXT}</Label>
                                                <Input {...this.endRouteStyling(pos)} value={destinationName} onChange={(event) => this.onPlaceChange(event, pos)}/>
                                            </Item>
                                        </Col>
                                        <Col style={{width: "15%", top: 25}}>
                                            <Button iconLeft transparent onPress={() => this.deletePlace(pos)}>
                                                <Icon type='AntDesign' name='delete'/>
                                            </Button>
                                        </Col>
                                    </Grid>
                                )}
                                <View style={styles.innerContainer}>
                                    <Button iconLeft transparent onPress={this.addPlace}> 
                                        <Icon name='add' />
                                        <Text>Add a place</Text>
                                    </Button>
                                </View>
                            </Form>
                            <View style={styles.innerContainer}>
                                <Button iconLeft 
                                    onPress={this.onSubmit}>
                                    <Icon name='search' />
                                    <Text>Find Shortest Path</Text>
                                </Button>
                            </View>
                        </Content>
                    </Container>
                </View>
            </Root>
        );
    }
}