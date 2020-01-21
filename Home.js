import React, { Component } from 'react';
import { Container, Header, Left, Body, Right, Title, Content, 
    Text, Form, Item, Label, Input, Button, Icon, Grid, Col } from 'native-base';
import { View } from 'react-native'
export default function Home() {
    return (
        <View style={{
                flexDirection: 'row',
                height: 100,
                padding: 20,
            }}>
            <Container>
                <Content>
                    <Body>
                        <Text>
                            Enter as many places as you'd like
                        </Text>
                    </Body>
                    
                    <Form>
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
                    </Form>

                    <View style={{ width: 150}}>
                        <Button iconLeft transparent>
                            <Icon name='add' />
                            <Text>Add a place</Text>
                        </Button>
                    </View>

                    <Button iconLeft>
                        <Icon name='search' />
                        <Text>Find Shortest Path</Text>
                    </Button>
                </Content>
            </Container>
        </View>
    );
}