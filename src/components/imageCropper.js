import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactCrop, { convertToPixelCrop } from "react-image-crop";

import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";

import "react-image-crop/dist/ReactCrop.css";

const ImageCropper = (props) => {
  const { src, onChangeCropImage } = props;
  // const [src, setSrc] = useState(null);
  const imageRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const [crop, setCrop] = useState({
    unit: "%", // Can be 'px' or '%'
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }); // Aspect ratio for cropping
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropString, setCropString] = useState(JSON.stringify(crop));
  const [completedCrop, setCompletedCrop] = useState();

  const onImageLoaded = (e) => {
    // Do something when the image is loaded
    // onCropComplete({
    //   ...crop,
    //   minWidth: 50,
    //   minHeight: 50,
    //   width: image.target.width,
    //   height: image.target.height,
    // });
    // eslint-disable-next-line
  };

  const onCropChange = (newCrop, percentCrop) => {
    // Adjust the crop area to meet the minimum height requirement
    // setCrop({
    //   ...newCrop,
    //   height:
    //     newCrop.height < crop.minHeight ? crop.minHeight : newCrop.height,
    //   width: newCrop.width < crop.minWidth ? crop.minWidth : newCrop.width,
    //   minWidth: 50,
    //   minHeight: 50,
    // });
    setCrop(percentCrop);
  };

  const onCropComplete = useCallback((c) => {
    setCompletedCrop(c);
    setCropString(JSON.stringify(c));
    // makeClientCrop(crop);
    // eslint-disable-next-line
  }, []);

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imageRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imageRef.current,
          previewCanvasRef.current,
          completedCrop
          // scale,
          // rotate
        );
      }
    },
    100,
    [completedCrop]
  );

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement("canvas");

    canvasPreview(image, canvas, crop);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        onChangeCropImage(blob);
        window.URL.revokeObjectURL(croppedImage);
        const croppedImageUrl = window.URL.createObjectURL(blob);
        resolve(croppedImageUrl);
      }, "image/jpeg");
    });
  };

  const makeClientCrop = useCallback(
    async (crop) => {
      const image = imageRef.current;
      if (image) {
        const croppedImageUrl = await getCroppedImg(image, crop);
        setCroppedImage(croppedImageUrl);
      }
    },
    // eslint-disable-next-line
    [imageRef]
  );

  const delayFunc = (delayTime = 100) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, delayTime);
    });
  };

  useEffect(
    (state) => {
      async function run() {
        console.log("cropString:", cropString);
        await delayFunc();
        const { width, height } = imageRef.current;
        makeClientCrop(convertToPixelCrop(crop, width, height));
      }
      run();
    },
    [cropString]
  );

  return (
    <div className="d-flex imag-crop-part align-items-center justify-content-center">
      {src && (
        <ReactCrop
          className=""
          // src={src}
          crop={crop}
          ruleOfThirds
          // onImageLoaded={onImageLoaded}
          onComplete={onCropComplete}
          onChange={onCropChange}
          minHeight={30}
          minWidth={30}
          // onDragStart={onCropChangeStart}
        >
          <img
            className=""
            src={src}
            onLoad={onImageLoaded}
            ref={imageRef}
            alt="selected_image"
          ></img>
        </ReactCrop>
      )}
      {/* {croppedImage && (
        <img alt="Crop" style={{ maxWidth: "100%" }} src={croppedImage} />
      )} */}
    </div>
  );
};

export default ImageCropper;
