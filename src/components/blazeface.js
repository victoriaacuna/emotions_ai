import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
// tfjsWasm.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@latest/dist/tfjs-backend-wasm.wasm');

const Blazeface = props => {
    
    const blazeface = require('@tensorflow-models/blazeface');

    const [sectionClass, setSectionClass] = useState("invisible");
    let video = document.getElementById('webcam');
    const liveView = document.getElementById('liveView');
    // Pretend model has loaded so we can try out the webcam code.
    // Store the resulting model in the global scope of our app.
    const [model, setModel] = useState(undefined);

    let ctx, videoWidth, videoHeight, canvas;

    const state = {
        backend: 'wasm'
    };


    // Check if webcam access is supported.
    const getUserMediaSupported= ()=> {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    const predictWebcam = () => {

        video.play()
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
        video.width = videoWidth;
        video.height = videoHeight;
      
        canvas = document.getElementById('output');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        ctx = canvas.getContext('2d');
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        

        const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
        const flipHorizontal = true;
        const annotateBoxes = true;

        console.log('listo para hacer AI');

        model.estimateFaces(video, returnTensors, 
            flipHorizontal, annotateBoxes
        )
        .then( predictions => {

            console.log('good news');

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
            
                for (let i = 0; i < predictions.length; i++) {

                    if (returnTensors) {

                        predictions[i].topLeft = predictions[i].topLeft.arraySync();
                        predictions[i].bottomRight = predictions[i].bottomRight.arraySync();
                        if (annotateBoxes) {
                            predictions[i].landmarks = predictions[i].landmarks.arraySync();
                        }
                    }
                    const start = predictions[i].topLeft;
                    const end = predictions[i].bottomRight;
                    const size = [end[0] - start[0], end[1] - start[1]];
            
                    // Render a rectangle over each detected face.
                    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                    ctx.fillRect(start[0], start[1], size[0], size[1]);

                    if (annotateBoxes) {
                        const landmarks = predictions[i].landmarks;
                
                        ctx.fillStyle = "blue";
                        for (let j = 0; j < landmarks.length; j++) {
                          const x = landmarks[j][0];
                          const y = landmarks[j][1];
                          ctx.fillRect(x, y, 5, 5);
                        }
                    }
                }
            }

            requestAnimationFrame(predictWebcam)
        })
    }

    // Enable the live webcam view and start classification.
    const enableCam = (event) => {

        // Only continue if the COCO-SSD has finished loading.
        if (!model) {
            console.log('no hay modelo');
            return;
        } else {
            console.log('habemus modelo');
            // Hide the button once clicked.
            event.target.classList.add('removed'); 

            // getUsermedia parameters to force video but not audio.
            const constraints = {
                // video: true
                video: { facingMode: 'user' }
            };

            // Activate the webcam stream.
            navigator.mediaDevices.getUserMedia(constraints)
            .then( (stream) => {
                console.log('camara habilitada');
                video.srcObject = stream;
                video.addEventListener('loadeddata', predictWebcam);
            })
            .catch( error => {
                console.log('error para habilitar la camara');
            })
        }
    }


    const handleEnableCamera = (event) => {

        if (getUserMediaSupported()) {
            enableCam(event);
        } else {
            console.warn('getUserMedia() is not supported by your browser');
        }

    }


    const setupPage = () => {
  
        tf.setBackend(state.backend).then(() => {
            console.log('back ready ');
            blazeface.load().then( (loadedModel) => {

                setModel(loadedModel)
                setSectionClass("")
                console.log('modelo cargado');
            })
            .catch( error => {
                console.log(error);
                console.log('no cargo');
            })
        })

      };

    useEffect(() => {
        setupPage()
        return () => {
        }
    }, [])


    return (
        <div>
            <div>BLAZEFACE</div>
            <section id="demos" className={sectionClass}>
                <button id="webcamButton" onClick={handleEnableCamera} >Enable Webcam</button>
                <div id="liveView" className="camView">   
                    <video 
                        id="webcam" 
                        autoPlay 
                        width="640" 
                        height="480"
                        // playsinline 
                        style={{
                            "-webkit-transform":"scaleX(-1)",
                            "transform": "scaleX(-1)"
                        }}
                    >
                    </video>
                    <canvas id="output"></canvas>
                    
                </div>
            </section>
            
        </div>
    )
}

Blazeface.propTypes = {

}

export default Blazeface
