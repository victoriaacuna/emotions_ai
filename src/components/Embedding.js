import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as tf from "@tensorflow/tfjs-core";
import * as tf_2 from "@tensorflow/tfjs";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import group from "./../assets/group.png";
import fotito from "./../assets/La-depresión-detrás-de-la-sonrisa.jpeg";
import {getEmotion} from "../helpers/getEmotion";

const Embedding = (props) => {
  const [sectionClass, setSectionClass] = useState("invisible");
  const [currentImage, setCurrentImage] = useState(fotito);
  const [model, setModel] = useState(undefined);
  const [model2, setModel2] = useState(undefined);
  const canvas2 = document.getElementById("canvas");
  const state = {
    backend: "wasm",
  };
  let ctx, videoWidth, videoHeight, canvas, context;
  const modelImageSize = 160;

  const setupPage = () => {
    tf.setBackend(state.backend).then(() => {
      console.log("back ready ");
      loadModel()
      setSectionClass("");
      console.log("modelo cargado");
       
    });
  };

  useEffect(() => {
    setupPage();
    return () => {};
  }, []);
const loadModel = async () =>{

setModel2(await tf_2.loadLayersModel('http://localhost:8887/model.json'))
console.log('holaaas')
}

  const embeddingModel = async () => {

    context = canvas2.getContext("2d");
 
    const imgPrueba = new Image();
    imgPrueba.src=fotito
    context.drawImage(imgPrueba,0,0)
    var imageData = context.getImageData(0, 0,modelImageSize, modelImageSize);
    let baw_array = [];

    for (var i=0;i<imageData.data.length;i+=4) {

      
        let baw =  imageData.data[i]
        let baw1 =  imageData.data[i+1]
        let baw2 =  imageData.data[i+2]

        baw_array.push(baw)
        baw_array.push(baw1)
        baw_array.push(baw2)

    
    }
  //   for (var i=0;i<imageData.data.length;i+=4) {

  //     var avg = (imageData.data[i]+imageData.data[i+1]+imageData.data[i+2])/3;
  //     let baw = (0.3 * imageData.data[i]) + (0.59 * imageData.data[i+1]) + (0.11 * imageData.data[i+2])

  //     baw_array.push(baw)
  //     imageData.data[i] = avg;
  //     imageData.data[i+1] = avg;
  //     imageData.data[i+2] = avg;
  
  // }


    canvas2.getContext("2d").putImageData(imageData, 0, 0, 0, 0, modelImageSize, modelImageSize);
    let finalIMG = tf.tensor(baw_array);
    console.log('arreglo', finalIMG)
    finalIMG = tf.reshape(finalIMG, [1, modelImageSize, modelImageSize, 3])
    console.log('Shape de la imagen que le vamos a pasar al modelo', finalIMG.shape);
    let prediction = model2.predict(finalIMG)
    const value = prediction.dataSync()
    console.log("PREDICTION", value)
    // console.log("PREDICTION", getEmotion(value))

  };


  return (
    <div>
      <div>Embedding Model</div>

      <div
        className="prediction-div"
        style={{
          backgroundImage: `url(${currentImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center"
        }}
      ></div>

      {/* <div style={{'height': '150px', 'width':'250px'}}>
          {position}
      </div> */}

      <div id="demos" className={sectionClass}>
        {/* <button id="webcamButton" onClick={handleEnableCamera}>
          Enable Webcam
        </button> */}
        <button id="webcamButton" onClick={embeddingModel}>
          Embedding
        </button>
        <div id="liveView" className="camView2">
          <video
            id="webcam"
            autoPlay
            width="640"
            height="480"
            style={{
              "-webkit-transform": "scaleX(-1)",
              transform: "scaleX(-1)",
            }}
            // playsinline
          ></video>
          <canvas id="output"></canvas>

          <canvas
            id="canvas"
            // width={modelImageSize}
            // height={modelImageSize}
            width="640"
            height="480"
            // style={{
            //   "-webkit-transform": "scaleX(-1)",
            //   transform: "scaleX(-1)",
            // }}
          ></canvas>
        </div>
      </div>
    </div>
  );
};

Embedding.propTypes = {};

export default Embedding;