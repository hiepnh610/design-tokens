require('dotenv').config();
const util = require('util');
const fetch = require('node-fetch');
const fs = require('fs');
const _ = require('lodash');
const chalk = require('chalk');
const StyleDictionary = require('style-dictionary').extend('./config.json');

StyleDictionary.registerFormat({
  name: 'android/text-style-xml',
  formatter: _.template(fs.readFileSync(__dirname + '/templates/android-text-style-xml.template'))
});

const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const fetchFigmaFile = (id) => {
  const headers = {
    method: 'GET',
    headers: { 'X-Figma-Token': process.env.FIGMA_API_KEY }
  };

  return fetch(
    `https://api.figma.com/v1/files/${id}`,
    headers
  ).then(res => res.json());
};

const getDataByPageName = async () => {
  const figmaFile = await fetchFigmaFile('ewRLtugq1p9ysi3yzbV75X');
  const dataFromFile = figmaFile.document.children.find((item) => {
    return item.name === 'Core';
  });

  return dataFromFile.children;
};

const filterFrameData = async () => {
  const dataFromPageName = await getDataByPageName();

  return dataFromPageName.filter(item => item.type === 'FRAME');
};

const getSpacing = async () => {
  const frameData = await filterFrameData();
  const fetchSpacing = frameData.find(item => item.name === 'Spacing');
  const spacingFrame = fetchSpacing.children.find((item) => {
    return item.type === 'FRAME';
  });
  const instanceSpacing = spacingFrame.children.filter((item) => {
    return item.type === 'INSTANCE';
  });
};

const getColors = async () => {
  const pagesList = [
    'Branding Color Palette',
    'Support Color',
    'Functional Color Palette',
    'Base Color Palette'
  ];
  const frameData = await filterFrameData();

  return pagesList.map((page) => {
    const baseColor = frameData.find(item => item.name === page);

    return baseColor.children.filter((item) => {
      return item.type === 'INSTANCE';
    });

    // instanceBaseColor.forEach((colorCmp) => {
      // const fillsDataFromColorCmp = colorCmp.children[0].fills[0];

      // colors.push(colorCmp.children);

      // if (fillsDataFromColorCmp.type === 'SOLID') {
      //   const opacity = fillsDataFromColorCmp.opacity;
      //   const opacityFixed = opacity ? Number(opacity.toFixed(1)) : 0;
      //   const [r, g, b] = Object.values(fillsDataFromColorCmp.color)
      //   .map((value) => {
      //     return Number(((value + opacityFixed) * 255).toFixed(0));
      //   });

      //   // console.log({
      //   //   name: colorCmp.children[1].name,
      //   //   value: rgbToHex(r, g, b)
      //   // });
      // }

      // if (fillsDataFromColorCmp.type === 'GRADIENT_LINEAR') {
      //   // console.log('fillsDataFromColorCmp', fillsDataFromColorCmp);
      // }
    });
  // });
};

const getTypo = async () => {
  const pagesList = [
    'Text Style',
    'Font Family'
  ];
  const frameData = await filterFrameData();
  const pageName = frameData.find(item => item.name === 'Text Style');
  const frameType = pageName.children.filter(item => item.type === 'FRAME');

  // console.log('frameType', frameType[0].children[0].children[0].fills);

  const dataConfig = {
    size: {
      font: await frameType[0].children.map(async (item) => {
        const childrenItem = item.children[0];
        const colorName = await getColorName(childrenItem.fills[0].color);

        return {
          styleName: childrenItem.characters,
          fontSize: childrenItem.style.fontSize,
          lineHeight: childrenItem.style.lineHeightPx,
          fontFamily: childrenItem.style.fontWeight === 400 ? 'regular' : 'medium',
          color: colorName
        }
      })
    }
  };

  return dataConfig;
};

const getColorName = async (source) => {
  const colors = _.flatten(await getColors());
  const [r, g, b] = Object.values(source);
  let colorName = '';

  colors.forEach((item) => {
    const colorItem = item.children[0].fills[0].color;

    console.log('colors', item.children[0].fills[0].color);
    console.log('colors', item.children[1]);

    if (colorItem) {
      const isRed = r === colorItem.r;
      const isGreen = g === colorItem.g;
      const isBlue = b === colorItem.b;

      if (isRed && isGreen && isBlue) {
        colorName = item.children[1].name
      }
    }
  });

  return colorName;
};

const init = async () => {
  // console.log(
  //   'getTypo',
  //   chalk.cyan(
  //     util.inspect(
  //       await getTypo(),
  //       {
  //         showHidden: false,
  //         depth: null
  //       }
  //     )
  //   )
  // );

  await getTypo()

  // fs.writeFileSync('properties/size/test.json', JSON.stringify(content));
};

init();

// StyleDictionary.buildAllPlatforms();
