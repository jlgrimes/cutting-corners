import MAPS_API_KEY from './api-key'

export const MAPS_API_BASE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"

export const generateAPIUrl = (origin, destination) => MAPS_API_BASE_URL + "&origins=" + origin.split(" ").join(",") + "&destinations=" + destination.split(" ").join(",") + "&key=" + MAPS_API_KEY;