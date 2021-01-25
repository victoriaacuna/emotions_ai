import React, {useState, useRef, useEffect} from 'react';
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import logo from './logo.svg';
import './App.css';

function App() {

  const [sectionClass, setSectionClass] = useState("invisible")
  let video = document.getElementById('webcam');
  const liveView = document.getElementById('liveView');
  // const demosSection = document.getElementById('demos');
  // const enableWebcamButton = document.getElementById('webcamButton');
  
  // Check if webcam access is supported.
  const getUserMediaSupported= ()=> {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
    
  // If webcam supported, add event listener to button for when user
  // wants to activate it to call enableCam function which we will 
  // define in the next step.

    
  // Enable the live webcam view and start classification.
  const enableCam = (event) => {

      // Only continue if the COCO-SSD has finished loading.
      if (!model) {
        return;
      }
      
      // Hide the button once clicked.
      event.target.classList.add('removed');  
      
      // getUsermedia parameters to force video but not audio.
      const constraints = {
        video: true
      };
    
      // Activate the webcam stream.
      navigator.mediaDevices.getUserMedia(constraints)
      .then( (stream) => {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
      });
  }

  // Pretend model has loaded so we can try out the webcam code.
  // Store the resulting model in the global scope of our app.
  let model = undefined;
  
  // Before we can use COCO-SSD class we must wait for it to finish
  // loading. Machine Learning models can be large and take a moment 
  // to get everything needed to run.
  // Note: cocoSsd is an external object loaded from our index.html
  // script tag import so ignore any warning in Glitch.
  cocoSsd.load()
  .then( (loadedModel) => {
    model = loadedModel;
    // Show demo section now model is ready to use.
    setSectionClass("")
  });
  
  let children = [];
  
  const predictWebcam = () => {

    // Now let's start classifying a frame in the stream.
    model.detect(video)
    .then( (predictions) => {

      // Remove any highlighting we did previous frame.
      for (let i = 0; i < children.length; i++) {
        liveView.removeChild(children[i]);
      }
      children.splice(0);
      
      // Now lets loop through predictions and draw them to the live view if
      // they have a high confidence score.
      for (let n = 0; n < predictions.length; n++) {

        // If we are over 66% sure we are sure we classified it right, draw it!
        if (predictions[n].score > 0.66) {
          
          const p = document.createElement('p');
          p.innerText = predictions[n].class  + ' - with ' 
              + Math.round(parseFloat(predictions[n].score) * 100) 
              + '% confidence.';
          p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
              + (predictions[n].bbox[1] - 10) + 'px; width: ' 
              + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';
  
          const highlighter = document.createElement('div');
          highlighter.setAttribute('class', 'highlighter');
          highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
              + predictions[n].bbox[1] + 'px; width: ' 
              + predictions[n].bbox[2] + 'px; height: '
              + predictions[n].bbox[3] + 'px;';
  
          liveView.appendChild(highlighter);
          liveView.appendChild(p);
          children.push(highlighter);
          children.push(p);
        }
      }
      
      // Call this function again to keep predicting when the browser is ready.
      window.requestAnimationFrame(predictWebcam);

    });
  }
  

  const handleEnableCamera = (event) => {

    if (getUserMediaSupported()) {
      enableCam(event);
    } else {
      console.warn('getUserMedia() is not supported by your browser');
    }

  }
  


  return (
    <div className="App">

      <h1>Emotions detection</h1>


    
    <section id="demos" className={sectionClass}>

   
      
      <div id="liveView" className="camView">
        <button id="webcamButton" onClick={handleEnableCamera}>Enable Webcam</button>
        <video id="webcam" autoPlay width="640" height="480"></video>
      </div>
    </section>
</div>
  );
}

export default App;
