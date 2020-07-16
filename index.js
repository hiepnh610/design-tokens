require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');

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
  pagesList.map((page) => {
    const baseColor = frameData.find(item => item.name === page);

    const instanceBaseColor = baseColor.children.filter((item) => {
      return item.type === 'INSTANCE';
    });

    instanceBaseColor.map((colorCmp) => {
      const fillsDataFromColorCmp = colorCmp.children[0].fills[0];

      if (fillsDataFromColorCmp.type === 'SOLID') {
        const opacity = fillsDataFromColorCmp.opacity;
        const opacityFixed = opacity ? Number(opacity.toFixed(1)) : 0;
        const [r, g, b] = Object.values(fillsDataFromColorCmp.color)
        .map((value) => {
          return Number(((value + opacityFixed) * 255).toFixed(0));
        });

        // console.log({
        //   name: colorCmp.children[1].name,
        //   value: rgbToHex(r, g, b)
        // });
      }

      if (fillsDataFromColorCmp.type === 'GRADIENT_LINEAR') {
        console.log('fillsDataFromColorCmp', fillsDataFromColorCmp);
      }
    });
  });
};

const getTypo = async () => {
  const pagesList = [
    'Text Style',
    'Font Family'
  ];
  const frameData = await filterFrameData();
  const pageName = frameData.find(item => item.name === 'Text Style');
  const frameType = pageName.children.filter(item => item.type === 'FRAME');

  let dataConfig = {
    size: {
      font: {}
    }
  };

  frameType[0].children.forEach((item) => {
    dataConfig.size.font[item.children[0].characters] = {
      value: item.children[0].style.fontSize
    };
  });

  return dataConfig;
};

const init = async () => {
  const content = await getTypo();

  fs.writeFileSync('properties/size/test.json', JSON.stringify(content));
};

init();
