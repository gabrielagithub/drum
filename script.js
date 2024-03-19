const URL = "https://gabrielagithub.github.io/drum/";
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");

    // Selecionar o elemento label-container
    labelContainer = document.getElementById("label-container");
    // Verificar se o elemento label-container existe antes de tentar adicionar elementos filhos
    if (labelContainer) {
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    } else {
        console.error("Elemento label-container não encontrado.");
    }
}

async function loop(timestamp) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className;
        const probability = prediction[i].probability;

        // Atualizar a interface do usuário com a previsão atual
        if (labelContainer && labelContainer.childNodes[i]) {
            labelContainer.childNodes[i].innerHTML = `${classPrediction}: ${probability.toFixed(2)}`;
        }

        // Verificar se a probabilidade da previsão atual é maior que o limiar
        if (probability > 0.5) {
            // Executar a função de reprodução de som correspondente à classe de pose
            playSound(classPrediction);
        }
    }

    // Desenhar as poses na tela
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

function playSound(className) {
    switch (className) {
        case "Prato":
            document.getElementById("snare").play();
            break;
        case "Tambor":
            document.getElementById("kick").play();
            break;
        case "Desligada":
            document.getElementById("hihat").play();
            break;
                default:
            console.error("Classe de som não reconhecida:", className);
    }
}

// Inicializar a detecção de pose ao carregar a página
window.onload = init;
