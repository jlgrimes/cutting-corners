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
import { Autocomplete } from 'native-base-autocomplete'

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
            destinations: ["", "", "", "", ""], // initializes three empty places
            allDestinations: ["", "", "", "", ""], // used for distance matrix calc
            autocomplete: []
        };
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
        // console.log(url)

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
        var destinations = this.state.destinations
        //destination[pos] = text
        destinations[pos] = event.nativeEvent.text
        this.setState({ destinations })
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
        var destinations = this.state.destinations

        if (destinations.length <= 2) {
            showToast("You can't have less than 2 locations!", "Okay")
            return
        }

        destinations.splice(pos, 1)
        this.setState({ destinations })
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

                            {/*
                            <View style={styles.innerContainer}>
                                 <Text style={styles.header}>
                                    Enter places
                                </Text>
                            </View>
                            */}
                            
                            <Form>
                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.startAtCurrentLocation} onPress={() => this.setState({startAtCurrentLocation: !this.state.startAtCurrentLocation})} />
                                    <Text>Start your route at your current location</Text>
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
                                                <Label>{pos == 0 ? STARTING_PLACE_TEXT : pos < this.state.destinations.length - 1 ? PLACE_TEXT + " " + (pos) : ENDING_PLACE_TEXT}</Label>
                                                <Input value={destinationName} onChange={(event) => this.onPlaceChange(event, pos)}/>
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
                                    <Button iconLeft transparent onPress={() => this.addPlace()}>
                                        <Icon name='add' />
                                        <Text>Add a place</Text>
                                    </Button>
                                </View>

                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.returnBackHome} onPress={() => this.setState({returnBackHome: !this.state.returnBackHome})} />
                                    <Text>End your route at the starting point</Text>
                                </View>
                            </Form>

                            <View style={styles.innerContainer}>
                                <Button iconLeft 
                                    onPress={() => this.onSubmit()}>
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