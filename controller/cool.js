const cd = require('color-difference');
const diff = require('color-diff');
const color = require('color');
const colorMath = require('color-math')

exports.loadPage = (req,res,next) => {
    let color_result = req.flash("color_result");
    let error_result = req.flash("error");

    return res.render("pages/cool", {
        page_name: "dashboard",
        color_result: color_result,
        err: error_result
    });
}

exports.blend_color = (req,res,next) => {
    if (req.body.input_color_code != '') {
        let result = runOPt(req.body.input_color_code)
        console.log(result, '-----');
        if (result) {
            req.flash("color_result", result);
            return res.redirect('/cool')
        }else{
            req.flash("error", 'Please try again');
            return res.redirect('/cool')
        }

    }else{
        return res.redirect("/cool");
    }
}

let colors = {
	"red": {
		count: 0,
		code: "#650332"
	},
	"yellow": {
		count: 0,
		code: "#FFCE51"
	},
	"blue": {
		count: 0,
		code: "#00224C"
	},
	"white": {
		count: 0,
		code: "#FFFFFF"
	},
	"black": {
		count: 0,
		code: "#21211A"
	},
};

let oldColor = ''
let counter = 0
let difference
let closestColor;
let combinationArr = []

const colorAddition = (prevColor, currentColor) => {
    return colorMath.evaluate("("+prevColor+ "+" + currentColor +") / 2").resultStr
}

const docalc = () => {
    for (const key of Object.keys(colors)) {
        for (let index = 0; index < colors[key].count; index++) {
             oldColor = oldColor != '' ? colorAddition(oldColor, colors[key].code) : colors[key].code;
        }
    }
    return oldColor
}

const getClosestColor = (matchColor) => {
    let givenColorRGb = color(matchColor).object();
    var palette = [
        color(colors['red'].code).object(),
        color(colors['yellow'].code).object(),
        color(colors['blue'].code).object(),
        color(colors['white'].code).object(),
        color(colors['black'].code).object(),
    ];

    closestColor = diff.closest(givenColorRGb, palette);
    for (const key of Object.keys(colors)) {
        if (colors[key].code === color(closestColor).hex()) {
            colors[key].count++
        }
    }
}

const combinationaArrBuilder = (difference, color, original_color) => {
    return {
        'diff': difference,
        'orgin_color': original_color,
        'generated_color': color,
        'combo': {
            "red": colors['red'].count,
            "yellow": colors['yellow'].count,
            "blue": colors['blue'].count,
            "white": colors['white'].count,
            "black": colors['black'].count,
        }
    }
}

const runOPt = (matchColor) => {
    if (counter === 0) {
        getClosestColor(matchColor)
    }else{
        /**
         * set the last stable color to tempcolor variable
         * mixing tempcolor with all 5 color and calculation the difference
         * then get the less difference color and set it up
         */
        let newDiffArr = []
        let tempColor = oldColor;
        
        
        for (const key of Object.keys(colors)) {
            newDiffArr.push(cd.compare(matchColor, colorAddition(tempColor, colors[key].code)))
        }

        // console.log(newDiffArr);

        let newTempArr = [...newDiffArr]
        let tempArrSort = newTempArr.sort((a,b) => a - b)

        for (let index = 0; index < tempArrSort.length; index++) {
            if ((difference - tempArrSort[index]) > 0 && (difference - tempArrSort[index]) != 0) {
                let newColorBlock = Object.keys(colors)[newDiffArr.indexOf(tempArrSort[index])]

                if (colors[newColorBlock].count > 10) {
                    continue
                }else{
                    newColorBlock = Object.keys(colors)[newDiffArr.indexOf(tempArrSort[index])]
                    colors[newColorBlock].count++
                    break;
                }   
            }
        }
    }

    let resultColor = docalc()
    difference = cd.compare(matchColor, resultColor);
    combinationArr.push(combinationaArrBuilder(difference, resultColor, matchColor))
    if (difference > 5) {
        if (counter === 50) {
            combinationArr.sort((a,b) => a.diff - b.diff)
            return combinationArr[0]
        }
        counter++
        runOPt(matchColor)
    }else{
        counter++
        return combinationArr[0];
    }
}

