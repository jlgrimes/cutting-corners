import MAPS_API_KEY from './api-key'
import React, { Component } from 'react';
import { Container, Header, Left, Body, Right, Title, Content, 
    Text, Form, Item, Label, Input, Button, Icon, Grid, Col, Root, ActionSheet,
    CheckBox, Toast,
    Row} from 'native-base';
import { View, StyleSheet, ListItem } from 'react-native'
import { generateAPIUrl, permutator, generatePathUrl, generatePlaceAutocompleteUrl, 
    PLACE_TEXT, STARTING_PLACE_TEXT, ENDING_PLACE_TEXT } from './const';
import { Linking } from 'expo';
import DraggableFlatList from "react-native-draggable-flatlist";
import { Autocomplete } from 'native-base-autocomplete';
import Geocode from "react-geocode";
import { add } from 'react-native-reanimated';
import { withOrientation } from 'react-navigation';
Geocode.setApiKey(MAPS_API_KEY);

var BUTTONS = ["Apple Maps", "Google Maps", "Waze", "Cancel"];
var CANCEL_INDEX = 3;

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
            startAtCurrentLocation: false,
            destinations: ["", ""], // initializes three empty places
            allDestinations: ["", ""], // used for distance matrix calc
            autocomplete: []
        };
        this.addPlace = this.addPlace.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.endEqualsStart = this.endEqualsStart.bind(this);
        this.endRouteStyling = this.endRouteStyling.bind(this);
    }

    componentDidMount() {
        this.setCurrentLocation();
    }

    getDurationFromPath(distanceMatrix, path) {
        var duration = 0
        const { allDestinations } = this.state

        // iterating through all the sequential pairs
        for (let i = 0; i < path.length - 1; i++) {
            let firstPoint = allDestinations.indexOf(path[i])
            let secondPoint = allDestinations.indexOf(path[i + 1])

            let thisDuration = distanceMatrix[firstPoint]["elements"][secondPoint]["duration"]["value"]
            console.log(path[i] + "==>" + path[i + 1])
            console.log(thisDuration)

            duration += thisDuration
        }
        return duration
    }

    setCurrentLocation() {
        let destinations = this.state.destinations.slice();

        var getPosition = function () {
            var options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            return new Promise(function (resolve, reject) {
              navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
          }
          
        getPosition()
            .then((pos) => {
                console.log(pos);
                Geocode.fromLatLng(pos.coords.latitude, pos.coords.longitude).then(
                    response => {
                        let street = response.results[0].address_components[0].short_name + " " + response.results[0].address_components[1].short_name;
                        let city = response.results[0].address_components[3].short_name;
                        let address = street + " " + city;
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

    bruteForceShortestPath(distanceMatrix) {
        console.log(distanceMatrix)
        const { allDestinations } = this.state

        let startingDestination = allDestinations[0]
        let endingDestination = allDestinations[allDestinations.length - 1]
        let destinations = allDestinations.slice(1, allDestinations.length - 1)
        let permutations = permutator(destinations)

        let minDuration = Number.MAX_SAFE_INTEGER
        let minPath = []

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

        console.log("TOTAL SHORTEST PATH")
        console.log(minPath.join(" ==> "))
        console.log(minDuration)

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
                console.log(pathUrl)
                if (BUTTONS[buttonIndex] == "Google Maps") {
                    Linking.openURL(pathUrl).catch((err) => console.error('An error occurred', err));
                }
                this.setState({ clicked: BUTTONS[buttonIndex] });
            }
        )
    }

    getAllDistances() {
        let url = generateAPIUrl(this.state.allDestinations)
        console.log(url)

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
                this.bruteForceShortestPath(distanceMatrix)
            })
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

        // if pos == 0
        if (pos == 0) {

            // check if app is set to start at current location
            if (self.state.startAtCurrentLocation) {

                // this should, by default, uncheck the checkbox
                self.setState({ startAtCurrentLocation: !self.state.startAtCurrentLocation});
            }
        }

        destinations.splice(pos, 1)
        this.setState({ destinations })
    }

    // need to lock location in algo for routing
    lockPlace(pos) {
        // need to do
    }
    
    onSubmit() {
        // filter out all of the empty destinations
        let filteredDestinations = this.state.destinations.filter(destination => destination.length > 0)

        let allDestinations = filteredDestinations
        //allDestinations.unshift(this.state.startingPoint)
        //this.state.returnBackHome ? allDestinations.push(this.state.startingPoint) : allDestinations.push(this.state.endingPoint)
        this.state.returnBackHome ? allDestinations.push(allDestinations[0]) : null
        this.setState({ allDestinations }, () => this.getAllDistances()) // for distance matrix stuff
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
                                {this.state.destinations.slice(0, -1).map((destinationName, pos) => 
                                    <Grid>
                                        <Col>
                                            <Item floatingLabel>
                                                <Label class="active">{pos == 0 ? STARTING_PLACE_TEXT : pos < this.state.destinations.length - 1 ? PLACE_TEXT + " " + (pos) : ENDING_PLACE_TEXT}</Label>
                                                <Input value={destinationName} onChange={(event) => this.onPlaceChange(event, pos)}/>
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
                                <View style={styles.innerContainer}>
                                    <Button iconLeft onPress={this.addPlace}> 
                                        <Icon name='add' />
                                        <Text>Add a stop</Text>
                                    </Button>
                                </View>
                               
                            </Form>

                            <Form>
                                <Grid>
                                        <Col>
                                            <Item floatingLabel>
                                                <Label class="active">{ENDING_PLACE_TEXT}</Label>
                                                <Input value={this.state.destinations.slice(-1)[0]} onChange={(event) => this.onPlaceChange(event, this.state.destinations.length - 1)}/>
                                            </Item>
                                        </Col>
                                        <Col style={{width: "15%", top: 25}}>
                                            <Button iconLeft transparent onPress={() => this.lockPlace(this.state.destinations.length)}>
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
                        </Content>
                    </Container>
                </View>
            </Root>
        );
    }
}