import MAPS_API_KEY from './api-key'

export const PLACE_TEXT = "Stop"
export const STARTING_PLACE_TEXT = "Starting Location"
export const ENDING_PLACE_TEXT = "Ending Location"

export const MAPS_API_BASE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"
export const PLACE_AUTOCOMPLETE_API_BASE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json?"
export const MAPS_PATH_BASE_URL = "https://www.google.com/maps/dir/?api=1"
export const GENERAL_SEARCH_BASE_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json?query="

export const generateAPIUrl = (destinations) => MAPS_API_BASE_URL + "&origins=" + destinations.join("|").split(" ").join(",") + "&destinations=" + destinations.join("|").split(" ").join(",") + "&key=" + MAPS_API_KEY;
export const generatePathUrl = (origin, waypoints, destination) => MAPS_PATH_BASE_URL + "&origin=" + origin + "&waypoints="  + waypoints.join("|") + "&destination=" + destination;
export const generatePlaceAutocompleteUrl = (text) => PLACE_AUTOCOMPLETE_API_BASE_URL + "input=" + text + "&key=" + MAPS_API_KEY;
export const generateGeneralSearchURL = (query, CURRENT_COORDS) => GENERAL_SEARCH_BASE_URL + query + "&location=" + CURRENT_COORDS + "&radius=50000&key=" + MAPS_API_KEY; 

// extracts the address from general locations, returns the original if its a specific location
export const extractAddress = (destinations) => destinations.map(point => point.address !== undefined ? point.address : point)

// the text that shows up for each address in google maps
export const concatAddress = (path) => path.map(point => point.name !== undefined ? (point.name + " " + point.address) : point)

// maintain list of "types" already seen in perm
export const permutator = (inputArr, numSearch) => {  
  let result = [];
  // let typesALL = [];

  const permute = (arr, numSearch, addresses = [], types = []) => {
    if (addresses.length === numSearch) {
      result.push([addresses, types]);
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice(); 
        let next = curr.splice(i, 1)[0];
        let address = next[0];
        let type = next[1];

        // always put in specific addresses, otherwise check general type not in types already
        if ((type === 0 && !addresses.includes(address)) || !types.includes(type)) {
            permute(curr.slice(), numSearch, addresses.concat(address), types.concat(type));
        }
     }
   }
 }
 
 permute(inputArr, numSearch);

 return result;
}