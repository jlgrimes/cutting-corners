import MAPS_API_KEY from './api-key'

export const MAPS_API_BASE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"

export const generateAPIUrl = (destinations) => MAPS_API_BASE_URL + "&origins=" + destinations.join("|").split(" ").join(",") + "&destinations=" + destinations.join("|").split(" ").join(",") + "&key=" + MAPS_API_KEY;

export const permutator = (inputArr) => {
    let result = [];
  
    const permute = (arr, m = []) => {
      if (arr.length === 0) {
        result.push(m)
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice();
          let next = curr.splice(i, 1);
          permute(curr.slice(), m.concat(next))
       }
     }
   }
  
   permute(inputArr)
  
   return result;
  }