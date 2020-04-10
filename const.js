import MAPS_API_KEY from './api-key'

export const PLACE_TEXT = "Place"
export const STARTING_PLACE_TEXT = "Starting Location"
export const ENDING_PLACE_TEXT = "Ending Location"

export const MAPS_API_BASE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"
export const PLACE_AUTOCOMPLETE_API_BASE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json?"
export const MAPS_PATH_BASE_URL = "https://www.google.com/maps/dir/?api=1"
export const GENERAL_SEARCH_BASE_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json?query="

export const generateAPIUrl = (destinations) => MAPS_API_BASE_URL + "&origins=" + destinations.join("|").split(" ").join(",") + "&destinations=" + destinations.join("|").split(" ").join(",") + "&key=" + MAPS_API_KEY;
export const generatePathUrl = (origin, waypoints, destination) => MAPS_PATH_BASE_URL + "&origin=" + origin + "&waypoints="  + waypoints.join("|") + "&destination=" + destination;
export const generatePlaceAutocompleteUrl = (text) => PLACE_AUTOCOMPLETE_API_BASE_URL + "input=" + text + "&key=" + MAPS_API_KEY;
export const generateGeneralSearchURL = (query, CURRENT_COORDS) => GENERAL_SEARCH_BASE_URL + query + "&location=" + CURRENT_COORDS + "&radius=30000&key=" + MAPS_API_KEY;


// maintain list of "types" already seen in perm
export const permutator = (inputArr, numSearch) => {  
  let result = [];

  const permute = (arr, numSearch, addresses = [], types) => {
    if (addresses.length === numSearch) {
      result.push(addresses);        
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice(); 
        let next = curr.splice(i, 1)[0];
        let address = next[0];
        let type = next[1];

        // always put in specific addresses, otherwise check general type not in types already
        if ((type === 0 && !addresses.includes(address)) || !types.has(type)) {
            permute(curr.slice(), numSearch, addresses.concat(address), types.add(type));
            types.delete(type);
        }
     }
   }
 }
 
 permute(inputArr, numSearch, [], new Set());

 return result;
}