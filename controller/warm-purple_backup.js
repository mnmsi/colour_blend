const cd = require('color-difference');
const diff = require('color-diff');
const color = require('color');
const colorMath = require('color-math')

exports.loadPage = (req,res,next) => {
    let color_result = req.flash("color_result");
    let error_result = req.flash("error");

    return res.render("pages/warm-purple", {
        page_name: "dashboard",
        color_result: color_result,
        err: error_result
    });
}

exports.blend_color = (req,res,next) => {
    const {input_color_code} = req.body;
    if (input_color_code) {
        runOPt(input_color_code, req, res);
    }else{
        return res.redirect("/warm-purple");
    }
}

let colors = {
	"red": {
		count: 0,
		// code: "#650332"
		code: "#890041"
	},
	"yellow": {
		count: 0,
		code: "#FFCE51",

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
	"purple": {
		count: 0,
		code: "#4E3379"
	},
};

let oldColor = '';
let counter = 0;
let difference = 0;
let closestColor = {};
let combinationArr = [];

const resetVariables = () => {
    difference = 0;
    oldColor = '';
    counter = 0;
    closestColor = {};
    combinationArr = [];
    colors = {
        "red": {
            count: 0,
            // code: "#650332"
            code: "#890041"
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
        "purple": {
            count: 0,
            code: "#4E3379"
        },
    };
}

const colorAddition = (prevColor, currentColor) => {
    return colorMath.evaluate("("+prevColor+ "-" + currentColor +" - 1)").resultStr
    // return colorMath.evaluate("("+prevColor+ "+" + currentColor +") / 2").resultStr
}

const doCalc = () => {
    for (const key of Object.keys(colors)) {
        for (let index = 0; index < colors[key].count; index++) {
             oldColor = oldColor != '' ? colorAddition(oldColor, colors[key].code) : colors[key].code;
        }
    }
    return oldColor
}

const getClosestColor = (matchColor) => {
    try {
        
        let givenColorRGb = color(matchColor).object();
        var palette = [
            color(colors['red'].code).object(),
            color(colors['yellow'].code).object(),
            color(colors['blue'].code).object(),
            color(colors['white'].code).object(),
            color(colors['black'].code).object(),
            color(colors['purple'].code).object(),
        ];
    
        closestColor = diff.closest(givenColorRGb, palette);
        for (const key of Object.keys(colors)) {
            if (colors[key].code === color(closestColor).hex()) {
                colors[key].count++;
            }
        }
        return true;
    } catch (error) {
        console.log({error: error?.message});
        return false;
    }
}

const combinationArrBuilder = (difference, color, original_color) => {
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
            "purple": colors['purple'].count,
        }
    }
}

const runOPt = (matchColor, req, res) => {
    if (counter == 0) {
        console.log({matchColor});
        const result = getClosestColor(matchColor);
        if(!result){
            console.log({result});
            req.flash("error", `${matchColor} is not a valid color to parse and blend`);
            resetVariables();
            return res.redirect("/warm-purple");
        }
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

    let resultColor = doCalc()
    difference = cd.compare(matchColor, resultColor);
    combinationArr.push(combinationArrBuilder(difference, resultColor, matchColor))
    if (difference > 10) {
        if (counter == 20) {
            combinationArr.sort((a,b) => a.diff - b.diff);
            console.log("====:202:====Result:====", {combinationArr: combinationArr[0]});
            req.flash("color_result", combinationArr[0]);
            resetVariables();
            return res.redirect('/warm-purple');
        }
        counter++
        runOPt(matchColor, req, res)
    }else{
        req.flash("color_result", combinationArr[0]);
        resetVariables();
        return res.redirect('/warm-purple');
    }
}

