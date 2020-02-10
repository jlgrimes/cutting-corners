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
            startAtCurrentLocation: false
        };
    }

    getDistance() {
        // Example usage
        let url = generateAPIUrl(origin="New York City", destination="Washington DC")

        fetch(url)
            .then((response) => {
                console.log(response.json());
            })
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
                                    <Input disabled={this.state.startAtCurrentLocation}/>
                                </Item>

                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.startAtCurrentLocation} onPress={() => this.setState({startAtCurrentLocation: !this.state.startAtCurrentLocation})} />
                                    <Text>Start your route at your current location</Text>
                                </View>

                                <Item floatingLabel>
                                    <Label>Place 1</Label>
                                    <Input />
                                </Item>
                                <Item floatingLabel last>
                                    <Label>Place 2</Label>
                                    <Input />
                                </Item>
                                <Item floatingLabel last>
                                    <Label>Place 3</Label>
                                    <Input />
                                </Item>

                                <View style={styles.innerContainer}>
                                    <Button iconLeft transparent>
                                        <Icon name='add' />
                                        <Text>Add a place</Text>
                                    </Button>
                                </View>
                                
                                <Item floatingLabel>
                                    <Label style={{color: this.state.returnBackHome ? "#D3D3D3" : "#404040" }}>Ending Point</Label>
                                    <Input disabled={this.state.returnBackHome}/>
                                </Item>

                                <View style={styles.innerContainer}>
                                    <CheckBox checked={this.state.returnBackHome} onPress={() => this.setState({returnBackHome: !this.state.returnBackHome})} />
                                    <Text>End your route at the starting point</Text>
                                </View>
                            </Form>

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