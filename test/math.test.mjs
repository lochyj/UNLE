import { degrees_to_radians, radians_to_degrees } from "../src/math.mjs"

// -----|
// Init |
// -----|

const errors = []

// --------|
// Helpers |
// --------|

Number.prototype.decimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0; 
}

// ---------------------------|
// Testing degrees_to_radians |
// ---------------------------|

//[
//  [x, y], // x is the input y is the expected output.
//]
const degrees_to_radians_test = [
    [180, 3.14159],
    [90, 1.5708],
    [15, 0.261799],
    [30, 0.523599],
    [22, 0.383972],
    [360, 6.28319],
    [45, 0.785398],
    [34.4553, 0.6013584298],
    [18.5, 0.3228859],
    [280, 4.88692]
]

for (var i = 0; i < degrees_to_radians_test.length; i++) {
    var result = degrees_to_radians(degrees_to_radians_test[i][0])

    // Round to the same number of decimal places
    result = result.toFixed(degrees_to_radians_test[i][1].decimals())

    if (result != degrees_to_radians_test[i][1]) {
        const error =`degrees_to_radians() failed test:\n\tIn: ${degrees_to_radians_test[i][0]}\n\n\tExpected: ${degrees_to_radians_test[i][1]}\n\tGiven: ${result}`
        console.error(error)
        errors.push(error)
    }
}

// ---------------------------|
// Testing radians_to_degrees |
// ---------------------------|

//[
//  [x, y], // x is the input y is the expected output.
//]
const radians_to_degrees_test = [
    [180, 3.14159],
    [90, 1.5708],
    [15, 0.261799],
    [30, 0.523599],
    [22, 0.383972],
    [360, 6.28319],
    [45, 0.785398],
    [34.4553, 0.6013584298],
    [18.5, 0.3228859],
    [280, 4.88692]
]

for (var i = 0; i < radians_to_degrees_test.length; i++) {
    var result = radians_to_degrees(radians_to_degrees_test[i][1])

    // Round to the same number of decimal places
    result = result.toFixed(radians_to_degrees_test[i][0].decimals())

    if (result != radians_to_degrees_test[i][0]) {
        const error =`radians_to_degrees() failed test:\n\tIn: ${radians_to_degrees_test[i][0]}\n\n\tExpected: ${radians_to_degrees_test[i][1]}\n\tGiven: ${result}`
        console.error(error)
        errors.push(error)
    }
}




console.log(`There were ${errors.length} errors.`)
