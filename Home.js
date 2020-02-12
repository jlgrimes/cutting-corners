import React, { Component } from 'react';
import { Container, Header, Left, Body, Right, Title, Content, 
    Text, Form, Item, Label, Input, Button, Icon, Grid, Col, Root, ActionSheet,
    CheckBox, 
    Row} from 'native-base';
import { View, StyleSheet } from 'react-native'
import { generateAPIUrl } from './const';

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

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            returnBackHome: false,
            startAtCurrentLocation: false,
            startingPoint: "",
            destinations: ["", "", ""], // initializes three empty places
            endingPoint: ""
        };
    }

    getAllDistances(destinationPairs) {
        Promise.all(destinationPairs.map(pair => {
            let url = generateAPIUrl(pair[0], pair[1])
            console.log(url)

            return fetch(url)
                .then(response => response.json())
        }))
        .then(data => console.log(data))
    }

    onPlaceChange(event, pos) {
        var destinations = this.state.destinations
        destinations[pos] = event.nativeEvent.text
        this.setState({ destinations })
    }

    addPlace() {
        var destinations = this.state.destinations
        destinations.push("")
        this.setState({ destinations })
    }
    
    onSubmit() {
        // filter out all of the empty destinations
        let filteredDestinations = this.state.destinations.filter(destination => destination.length > 0)

        let allDestinations = filteredDestinations
        allDestinations.unshift(this.state.startingPoint)
        this.state.returnBackHome ? allDestinations.push(this.state.startingPoint) : allDestinations.push(this.state.endingPoint)

        var destinationPairs = []
        for (let i = 0; i < allDestinations.length - 1; i++) {
            destinationPairs.push([allDestinations[i], allDestinations[i + 1]])
        }

        this.getAllDistances(destinationPairs)
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

                            <View style={styles.innerContainer}>
                                 <Text style={styles.header}>
                                    Enter places
                                </Text>
                            </View>
                            
                            <Form>
                                <Item floatingLabel>
                                    <Label style={{color: this.state.startAtCurrentLocation ? "#D3D3D3" : "#404040" }}>Starting Point</Label>
                                    <Input disabled={this.state.startAtCurrentLocation} value={this.state.startingPoint} onChange={(event) => this.setState({startingPoint: event.nativeEvent.text})}/>
                                </Item>

                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.startAtCurrentLocation} onPress={() => this.setState({startAtCurrentLocation: !this.state.startAtCurrentLocation})} />
                                    <Text>Start your route at your current location</Text>
                                </View>

                                {this.state.destinations.map((destinationName, pos) => 
                                    <Item floatingLabel>
                                        <Label>Place {pos + 1}</Label>
                                        <Input value={destinationName} onChange={(event) => this.onPlaceChange(event, pos)}/>
                                    </Item>
                                )}

                                <View style={styles.innerContainer}>
                                    <Button iconLeft transparent onPress={() => this.addPlace()}>
                                        <Icon name='add' />
                                        <Text>Add a place</Text>
                                    </Button>
                                </View>
                                
                                <Item floatingLabel>
                                    <Label style={{color: this.state.returnBackHome ? "#D3D3D3" : "#404040" }}>Ending Point</Label>
                                    <Input disabled={this.state.returnBackHome} value={this.state.endingPoint} onChange={(event) => this.setState({endingPoint: event.nativeEvent.text})}/>
                                </Item>

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

                            <View style={styles.innerContainer}>
                                <Button iconLeft 
                                    onPress={() =>
                                        ActionSheet.show(
                                        {
                                            options: BUTTONS,
                                            cancelButtonIndex: CANCEL_INDEX,
                                            title: "Shortest path generated! Choose an app to open in"
                                        },
                                        buttonIndex => {
                                            this.setState({ clicked: BUTTONS[buttonIndex] });
                                        }
                                    )}>
                                    <Icon name='search' />
                                    <Text>show the model</Text>
                                </Button>
                            </View>
                        </Content>
                    </Container>
                </View>
            </Root>
        );
    }
}