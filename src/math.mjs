
const degrees_to_radians = (angle_in_degrees)  => {
    return angle_in_degrees * (Math.PI / 180);
}

const radians_to_degrees = (angle_in_radians) => {
    return angle_in_radians * (180 / Math.PI);
}


export { degrees_to_radians, radians_to_degrees};
