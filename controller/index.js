const cd = require('color-difference');
const diff = require('color-diff');
const color = require('color');
const colorMath = require('color-math')

exports.loadPage = (req,res,next) => {
    let color_result = req.flash("color_result");
    let error_result = req.flash("error");

    return res.render("pages/index", {
        page_name: "dashboard",
        color_result: color_result,
        err: error_result
    });
}

exports.blend_color = async (req, res, next) => {
    const {input_color_code} = req.body;
    console.log({input_color_code});
    if (input_color_code) {
        runOPt(input_color_code, req, res);

    }else{
        return res.redirect("/");
    }
}

let colors = {
	"red": {
		count: 0,
		code: "#C40D1E",
		// code: "#C40D20"
	},
	"yellow": {
		count: 0,
		code: "#FFCC00"
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

let difference = 100;
let counter = 0;
let closestColor = {};
let combination = {};
let targetColor = '';

const resetVariables = () => {
    difference = 100;
    oldColor = '';
    counter = 0;
    closestColor = {};
    combinationArr = {};
    colors = {
        "red": {
            count: 0,
            code: "#C40D1E"
            // code: "#C40D20"
        },
        "yellow": {
            count: 0,
            code: "#FFCC00"
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
        ];
        
        console.log("====line:113====", {palette});

        closestColor = diff.closest(givenColorRGb, palette);
        if(counter == 0){
            difference = cd.compare(matchColor, color(closestColor).hex());
        }
        console.log("====:89:====closestColor:====", closestColor);
        for (const key of Object.keys(colors)) {
            if (colors[key].code == color(closestColor).hex()) {
                colors[key].count++;
            }
        }
        return true;
    } catch (error) {
        return false;
    }

}

const combinationBuilder = (difference, color, original_color) => {
    combination = {
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

// const hexColorAddition = (prevColor, currentColor) => {
//     const evaluatedResult = colorMath.evaluate("("+prevColor+ "+" + currentColor +") / 2").resultStr;
//     return evaluatedResult;
// };

// blend two hex colors together by an amount
function hexColorAddition(colorA, colorB, amount = 0.5) {
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
  const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
  const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
  const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
  return '#' + r + g + b;
}

const runOPt = (matchColor, req, res) => {
    if (counter === 0) {
        // console.log("====:112:====runOPt:====", {matchColor, counter});
        const result = getClosestColor(matchColor);
        if(!result){
            console.log({result});
            req.flash("error", `${matchColor} is not a valid color to parse and blend`);
            resetVariables();
            return res.redirect("/");
        }else{
            targetColor = color(closestColor).hex();
            counter++;
            combinationBuilder(difference, targetColor, matchColor);
            runOPt(matchColor, req, res);
        }
    }else{
        console.log({difference, targetColor, matchColor});
        let flag = false;
        let color_key = '';
        let tempDiff = difference;
        let tempColor = targetColor;
        let targetTempColor;
        for(const key of Object.keys(colors)){
            tempColor = hexColorAddition(targetColor, colors[key].code);
            // const tempClosestColor = diff.closest(givenColorRGb, [color(tempColor).object()]);
            // const tempDiff = cd.compare(matchColor, color(tempClosestColor).hex());
            tempDiff = cd.compare(matchColor, tempColor);
            if(tempDiff < difference){
                console.log("======:189:tempColor:======", {tempColor});
                console.log("======:190:tempDiff:======", {tempDiff});
                flag = true;
                color_key = key;
                console.log("====:181:=====",{color_key});
                difference = tempDiff;
                targetTempColor = tempColor;
            }
            
        }
        if(!flag || counter > 20){
            console.log("====:201:====runOPt:====", {combination});
            req.flash("color_result", combination);
            resetVariables();
            return res.redirect('/');
        }else{
            if(color_key){
                targetColor = targetTempColor;
                console.log("====:208:====runOPt:====", {targetColor});
                // targetColor = hexColorAddition(targetColor, colors[color_key].code);
                // getClosestColor(targetColor);
                colors[color_key].count++;
                combinationBuilder(difference, targetColor, matchColor);
            }
            counter++;
            runOPt(matchColor, req, res);
        }
    }
}
