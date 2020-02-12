# Cutting Corners

Made by Jared Grimes, Max Bartnitski, Joe DiNobile, and Peter Mascheroni 

An app that gives you the shortest path between a list of destinations. Cross-platform for iOS and Android, built with React Native.

## To Run

### Adding API Key

To run the application, create the file `api-key.js` in the root of the project file, then add the code:

```
const MAPS_API_KEY = "enter key here"
export default MAPS_API_KEY
```

where `enter-key-here` is the API key that I sent you.

### Running the app

Inside the project's root directory, run the commands:

```
npm install -g expo-cli
npm install
npm start
```

You should be able to either scan QR code or open the app in the simulator of your choice.

## MVP 1

For our MVP 1, we would like the app to successfully generate the shortest path given up to 5 **specific** destinations (ex Starbucks on 10 mile, Michigan Union, McDonald's in Ann Arbor). Once this shortest path is generated, we will export this to **Google Maps**). The following tasks are needed to be complete for the success of MVP 1:

- **Jared** User experience fully integrates with the React state. This means all inputs in the user interface being relayed back to the state of the React application, and the Submit button correctly triggering the function which computes the shortest path.
- *someone* All distances between each destination are calculated using Google Maps' [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/start). Are all possible routes between each pair of destinations retrieved? Does the program become very slow to load if you have lots of destinations? Maybe not all of the destinations need to be retrieved - or maybe they do?
- *someone*  The shortest path from the origin to the destination is calculated given the callbacks from the API. This is done by brute force for small numbers of destinations, and Christofides's (or some other TSP algorithm) for many destinations.
- *someone* [Export shortest path to file](https://support.google.com/mymaps/answer/3024836?co=GENIE.Platform%3DDesktop&hl=en) for opening in Google Maps (as well as triggering Action Sheet once shortest path is done computing).