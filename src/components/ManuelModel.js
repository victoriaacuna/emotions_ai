import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as tf from "@tensorflow/tfjs-core";
import * as tf_2 from "@tensorflow/tfjs";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import group from "./../assets/group.png";
import {getEmotion} from "../helpers/getEmotion";

const ManuelModel = (props) => {

  // DEFINICIÓN DE VARIABLES Y CONSTANTES.

  // Este es el tamaño de pixeles con el que fue entrenado el modelo.
  // El modelo de Manuel fue entrenado con imágenes blanco y negro. Es decir, 48x48x1
  const modelImageSize = 48;
  // Esta variable guardará el url de la imagen actual (la que capta del video cada cierto tiempo).
  // Inicialmente toma el valor de un archivo png cualquiera (group).
  const [currentImage, setCurrentImage] = useState(group);
  // Este es el modelo que reconoce los rostros.
  const blazeface = require("@tensorflow-models/blazeface");
  // Esta variable guarda el valor de la clase para que pueda mostrar elementos de acuerdo a si el modelo se ha cargado o no.
  const [sectionClass, setSectionClass] = useState("invisible");
  // Esta variable es para poder acceder al video.
  let video = document.getElementById("webcam");
  // Guarda el modelo (en este caso, el modelo para el reconocimiento de rostros)
  const [model, setModel] = useState(undefined);
  const [model2, setModel2] = useState(undefined);
  // Este es el canvas donde se está dibujando la imagen cortada.
  const canvas2 = document.getElementById("canvas");
  // Variable que define el backend para poder cargar el modelo de blazeface.
  const state = {
    backend: "wasm",
  };
  // Definición de variables que serán utilizadas más adelante.
  let ctx, videoWidth, videoHeight, canvas, context;


  // const loadTensorflowModel = () => {
  //   const tf = require("@tensorflow/tfjs");
  //   const tfn = require("@tensorflow/tfjs-node");
  //   const handler = tfn.io.fileSystem("./path/to/your/model.json");
  //   const model = await tf.loadModel(handler);
  // }
  

  // Este método sirve para tomar solo la parte del canvas que tiene la imagen
  // Se deshace de todos los pixels tramsparentes.
  const trimCanvas = (c) => {

    let ctx = c.getContext("2d"),
      copy = document.createElement("canvas").getContext("2d"),
      pixels = ctx.getImageData(0, 0, c.width, c.height),
      l = pixels.data.length,
      i,
      bound = {
        top: null,
        left: null,
        right: null,
        bottom: null,
      },
      x,
      y;

    // Iterate over every pixel to find the highest
    // and where it ends on every axis ()
    const cont = 5;
    let aux = 0;
    for (i = 0; i < l; i += 4) {

      if (pixels.data[i + 3] !== 0) {

        // console.log('pixel', pixels.data[i + 3]);

        x = (i / 4) % c.width;
        y = ~~(i / 4 / c.width);

        if (bound.top === null) {
          bound.top = y;
        }

        if (bound.left === null) {
          bound.left = x;
        } else if (x < bound.left) {
          bound.left = x;
        }

        if (bound.right === null) {
          bound.right = x;
        } else if (bound.right < x) {
          bound.right = x;
        }

        if (bound.bottom === null) {
          bound.bottom = y;
        } else if (bound.bottom < y) {
          bound.bottom = y;
        }
      }
    }

    // Calculate the height and width of the content

    let trimHeight = bound.bottom - bound.top,
      trimWidth = bound.right - bound.left,
      trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

    copy.canvas.width = trimWidth;
    copy.canvas.height = trimHeight;
    copy.putImageData(trimmed, 0, 0);

    // Return trimmed canvas
    return copy.canvas;
  };
 
  // Capturar la imagen del video
  const snap = async (start, size, index) => {

    context = canvas2.getContext("2d");
    canvas2.width = videoWidth;
    canvas2.height = videoHeight;

    // Calcular la coordenada x real del top left, ya que el video está horizontalmente invertido.
    let realTopLeft_x = canvas2.width - (start[0] + size[0]);
    let imageWidth = size[0];
    const canvasWidth = canvas2.width;
    
    // Manejar cuando el rostro se sale de los bordes horizontales del video.
    if (realTopLeft_x > canvasWidth) {
      imageWidth = imageWidth - (canvasWidth - realTopLeft_x);
      realTopLeft_x = canvasWidth;
    }
    if (realTopLeft_x + imageWidth < 0) {
      imageWidth = realTopLeft_x;
      realTopLeft_x = realTopLeft_x - imageWidth;
    }

    // Calcular la coordenada y real del top left. 
    // Esta es la misma, ya que solo está invertido horizontalmente y no vertical.
    let realTopLeft_y = start[1];
    let imageHeight = size[1];
    const canvasHeight = canvas2.height;

    // Manejar cuando el rostro se sale de los bordes verticalmente del video.
    if (realTopLeft_y < 0) {
      imageHeight = imageHeight + realTopLeft_y;
      realTopLeft_y = 0;
    }

    if (imageHeight + realTopLeft_y > canvasHeight) {
      imageHeight = canvasHeight - realTopLeft_y;
    }

    // Dibujar la imagen recortada.
    context.drawImage(
      video,

      realTopLeft_x,
      realTopLeft_y,
      imageWidth,
      imageHeight,

      // realTopLeft_x,
      // realTopLeft_y,
      // modelImageSize+1,
      // modelImageSize+1,
      0,
      0,
      modelImageSize+1,
      modelImageSize+1,

    );

    // Capturar la imagen del rostro, deshaciéndose de los pixeles transparentes del canvas.
    let trimmedCanvas = trimCanvas(canvas2);

    
    const imageData = trimmedCanvas.getContext("2d").getImageData(
      0,
      0,
      trimmedCanvas.width,
      trimmedCanvas.height
    );

    // const imageData = canvas2.getContext("2d").getImageData(
    //     0,
    //     0,
    //     canvas2.width,
    //     canvas2.height
    // );
 
    // Convertir la imagen a blanco y negro y tener el array blanco y negro (un solo channel)
    let baw_array = [];
    for (var i=0;i<imageData.data.length;i+=4) {

        var avg = (imageData.data[i]+imageData.data[i+1]+imageData.data[i+2])/3;
        let baw = (0.3 * imageData.data[i]) + (0.59 * imageData.data[i+1]) + (0.11 * imageData.data[i+2])

        baw_array.push(baw)
        imageData.data[i] = avg;
        imageData.data[i+1] = avg;
        imageData.data[i+2] = avg;
    
    }
    
    // Modificar el canvas con la imagen b&w.
    trimmedCanvas.getContext("2d").putImageData(imageData, 0, 0, 0, 0, imageData.width, imageData.height);
    // Convertir la imagen del canvas en una imagen con un url.
    let url = trimmedCanvas.toDataURL();
    // Setear la imagen para poder visualizarla.
    setCurrentImage(url);

    // Crear tensor con la información de la imagen ya en blanco y negro.
    console.log(JSON.stringify(baw_array));
    let finalIMG = tf.tensor(baw_array);
    finalIMG = tf.reshape(finalIMG, [1, modelImageSize, modelImageSize, 1])
    console.log('i', index);
    console.log('Shape de la imagen que le vamos a pasar al modelo', finalIMG.shape);
    let prediction = model2.predict(finalIMG)
    const value = prediction.dataSync()
    console.log("PREDICTION", value)
    console.log("PREDICTION", getEmotion(value))

  };

  
  // Checkear si el acceso a la webCam es soportado por el navegador.
  const getUserMediaSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Predecir el rostro.
  const predictWebcam = () => {

    video.play();

    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;
    video.width = videoWidth;
    video.height = videoHeight;
    canvas = document.getElementById("output");
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

    const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
    const flipHorizontal = true;
    const annotateBoxes = true;

    // console.log("listo para hacer AI");

    model
      .estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes)
      .then( (predictions) => {

        if (predictions.length > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          /*
                    `predictions` is an array of objects describing each detected face, for example:
                
                    [
                        {
                        topLeft: [232.28, 145.26],
                        bottomRight: [449.75, 308.36],
                        probability: [0.998],
                        landmarks: [
                            [295.13, 177.64], // right eye
                            [382.32, 175.56], // left eye
                            [341.18, 205.03], // nose
                            [345.12, 250.61], // mouth
                            [252.76, 211.37], // right ear
                            [431.20, 204.93] // left ear
                        ]
                        }
                    ]
                    */

          console.log('predictions length', predictions.length);

          predictions.map( (face_detected, index) => {

            if (returnTensors) {
              face_detected.topLeft = face_detected.topLeft.arraySync();
              face_detected.bottomRight = face_detected.bottomRight.arraySync();
              if (annotateBoxes) {
                face_detected.landmarks = face_detected.landmarks.arraySync();
              }
            }
            const start = face_detected.topLeft;
            const end = face_detected.bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];

            // Render a rectangle over each detected face.
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(start[0], start[1], size[0], size[1]);

            // Tomar la imagen.
            snap(start, size, index);
            
            if (annotateBoxes) {
              const landmarks = face_detected.landmarks;
              ctx.fillStyle = "blue";
              landmarks.map( (mark) => {
                const x = mark[0];
                const y = mark[1];
                ctx.fillRect(x, y, 5, 5);
              })
              // for (let j = 0; j < landmarks.length; j++) {
              //   const x = landmarks[j][0];
              //   const y = landmarks[j][1];
              //   ctx.fillRect(x, y, 5, 5);
              // }
            }
            
          })

          // for (let i = 0; i < predictions.length; i++) {

          //   if (returnTensors) {
          //     predictions[i].topLeft = predictions[i].topLeft.arraySync();
          //     predictions[i].bottomRight = predictions[i].bottomRight.arraySync();
          //     if (annotateBoxes) {
          //       predictions[i].landmarks = predictions[i].landmarks.arraySync();
          //     }
          //   }
          //   const start = predictions[i].topLeft;
          //   const end = predictions[i].bottomRight;
          //   const size = [end[0] - start[0], end[1] - start[1]];

          //   // Render a rectangle over each detected face.
          //   ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
          //   ctx.fillRect(start[0], start[1], size[0], size[1]);

          //   // Tomar la imagen.
          //   snap(start, size, i);
            

          //   if (annotateBoxes) {
          //     const landmarks = predictions[i].landmarks;

          //     ctx.fillStyle = "blue";
          //     for (let j = 0; j < landmarks.length; j++) {
          //       const x = landmarks[j][0];
          //       const y = landmarks[j][1];
          //       ctx.fillRect(x, y, 5, 5);
          //     }
          //   }
          // }
        }
        // Cada medio minuto (30 segundos)
        setTimeout(function () {
          requestAnimationFrame(predictWebcam);
        }, 10000);
        // requestAnimationFrame(predictWebcam)
      });
  };

  // Enable the live webcam view and start classification.
  const enableCam = (event) => {

    // Only continue if the COCO-SSD has finished loading.
    if (!model) {
      console.log("no hay modelo");
      return;
    } else {
      console.log("habemus modelo");
      // Hide the button once clicked.
      event.target.classList.add("removed");

      // getUsermedia parameters to force video but not audio.
      const constraints = {
        // video: true
        video: {
          facingMode: "user",
        },
      };

      // Activate the webcam stream.
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          console.log("camara habilitada");
          video.srcObject = stream;
          video.addEventListener("loadeddata", predictWebcam);
        })
        .catch((error) => {
          console.log("error para habilitar la camara");
        });
    }
  };

  const handleEnableCamera = (event) => {
    if (getUserMediaSupported()) {
      enableCam(event);
    } else {
      console.warn("getUserMedia() is not supported by your browser");
    }
  };

  const setupPage = () => {
    tf.setBackend(state.backend).then(() => {
      console.log("back ready ");
      blazeface
        .load()
        .then( (loadedModel) => {
          loadModel()
          setModel(loadedModel);
          setSectionClass("");
          console.log("modelo cargado");
        })
        .catch((error) => {
          console.log(error);
          console.log("no cargo");
        });
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

  // useEffect(() => {
  //   loadModel();

  // }, []);
  return (
    <div>
      <div>Manuel Model</div>

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
        <button id="webcamButton" onClick={handleEnableCamera}>
          Enable Webcam
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

ManuelModel.propTypes = {};

export default ManuelModel;