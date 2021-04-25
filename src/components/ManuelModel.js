import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import group from './../assets/group.png';

const ManuelModel = props => {

    const [currentImage, setCurrentImage] = useState(group)
    const [prueba, setPrueba] = useState(true)

    const blazeface = require('@tensorflow-models/blazeface');

    const [sectionClass, setSectionClass] = useState("invisible");
    let video = document.getElementById('webcam');
    const liveView = document.getElementById('liveView');

    // Pretend model has loaded so we can try out the webcam code.
    // Store the resulting model in the global scope of our app.
    const [model, setModel] = useState(undefined);

    let ctx, videoWidth, videoHeight, canvas, w, h, ratio, canvas2, context;
    canvas2 = document.getElementById('canvas');
    console.log("CANVAS", canvas2)


    ///define a function
    const snap = async (start, size) => {

        context = canvas2.getContext('2d');
        ratio = video.videoWidth / video.videoHeight;
        w = video.videoWidth - 100;
        h = parseInt(w / ratio, 10);
        // canvas2.width = w;
        // canvas2.height = h;
        canvas2.width = videoWidth;
        canvas2.height = videoHeight;
        // context.fillRect(0, 0, w, h);


        // context.fillRect(0, 0, canvas2.width , canvas2.height)
        // context.drawImage(
        //     video, 0, 0, canvas2.width , canvas2.height)
        // context.save()
        // let image = new Image();
        // image.src = canvas2.toDataURL();
        // // context.fillRect(0, 0, canvas2.width , canvas2.height)
        // // context.translate(canvas2.width , 0);
        // context.scale(-1, 1);
        // context.drawImage(image, -1, 0,canvas2.width , canvas2.height);
        // let image2 = new Image();
        // image2.src = canvas2.toDataURL();
        // context.restore();
        // context.save();


        let realTopLeft_x = canvas2.width-(start[0]+size[0]);
        let imageWidth = size[0];
        const canvasWidth = canvas2.width; 
        // let auxWidth = (imageWidth + realTopLeft < canvas2.width) ? (size[0]) : (canvas2.width - start[0])

        if(realTopLeft_x>canvasWidth){
            imageWidth = imageWidth - (canvasWidth - (realTopLeft_x))
            realTopLeft_x = canvasWidth
        }
        if((realTopLeft_x+imageWidth)<0){
            imageWidth = realTopLeft_x
            realTopLeft_x = realTopLeft_x - imageWidth;
        }

        let realTopLeft_y = start[1];
        let imageHeight = size[1];
        const canvasHeight = canvas2.height;

        if(realTopLeft_y < 0){
            imageHeight = imageHeight + realTopLeft_y
            realTopLeft_y = 0;
        }

        if((imageHeight +  realTopLeft_y) > canvasHeight){
            imageHeight = canvasHeight - realTopLeft_y
        }

        // context.fillRect(realTopLeft_x, realTopLeft_y, imageWidth, imageHeight);
        context.drawImage(
            video, 
            realTopLeft_x, realTopLeft_y, imageWidth, imageHeight,
            realTopLeft_x, realTopLeft_y, imageWidth, imageHeight,
        )
        // context.fillRect(0, 0, 250, 250);
        // context.drawImage(
        //     video, 
        //     realTopLeft_x, realTopLeft_y, imageWidth, imageHeight,
        //     0, 0, 250, 250,
        // )
 
        



        // context.drawImage(
        //     video, start[0], start[1], size[0], size[1],
        //     start[0], start[1], size[0], size[1])
        let url = canvas2.toDataURL()
        await setCurrentImage(url)

        console.log('url', url)

        // setCurrentImage(url)
    }
    const state = {
        backend: 'wasm'
    };


    // Check if webcam access is supported.
    const getUserMediaSupported = () => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    const predictWebcam = () => {

        video.play()

        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
        video.width = videoWidth;
        video.height = videoHeight;
        // if(prueba<=3){
        // console.log('VIDEO',video)
        // setPrueba(prueba+1)
        // }


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
            .then(predictions => {

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
                        // context.fillRect(start[0], start[1], size[0], size[1]);


                        if (prueba) {
                            snap(start, size)
                        }

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
                // Cada medio minuto (30 segundos)
                setTimeout(function(){
                    requestAnimationFrame(predictWebcam)
                }, 10000);
                // requestAnimationFrame(predictWebcam)

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
                video: {
                    facingMode: 'user'
                }
            };

            // Activate the webcam stream.
            navigator.mediaDevices.getUserMedia(constraints)
                .then((stream) => {
                    console.log('camara habilitada');
                    video.srcObject = stream;
                    video.addEventListener('loadeddata', predictWebcam);
                })
                .catch(error => {
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
            blazeface.load().then((loadedModel) => {

                setModel(loadedModel)
                setSectionClass("")
                console.log('modelo cargado');
            })
                .catch(error => {
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
            <div>
                Manuel Model
            </div>

            <div
                className='prediction-div'
                style={{
                    backgroundImage: `url(${currentImage})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                }}
            >

            </div>

            {/* <div style={{'height': '150px', 'width':'250px', 'backgroundColor': colorsito}}>
                {position}
            </div> */}

            <div
                id="demos"
                className={sectionClass}
            >
                <button
                    id="webcamButton"
                    onClick={handleEnableCamera}
                >
                    Enable Webcam
                </button>
                <div
                    id="liveView"
                    className="camView2"
                >
                    <video
                        id="webcam"
                        autoPlay
                        width="640"
                        height="480"
                        style={{
                            "-webkit-transform": "scaleX(-1)",
                            "transform": "scaleX(-1)"
                        }}
                    // playsinline 

                    >
                    </video>
                    <canvas id="output" 
                    
                    ></canvas>

                    <canvas id="canvas" width="640" height="480"
                      style={{
                        "-webkit-transform": "scaleX(-1)",
                        "transform": "scaleX(-1)"
                    }}></canvas>

                </div>
            </div>

        </div>
    )
}

ManuelModel.propTypes = {

}

export default ManuelModel
