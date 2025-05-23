const CONFIG = {
  color: '#FFFFFF',
  trailLength: 4,
  size: 7,
};

const createTrail = (options) => {
  const totalParticles = options?.length || 8;
  let particlesColor = options?.color || '#A052FF';
  const canvas = options?.canvas;
  const context = canvas.getContext('2d');
  let cursor = { x: 0, y: 0 };
  let particles = [];
  let width, height;
  let sizeX = options?.size || 3;
  let sizeY = sizeX * 2.2;
  let cursorsInitted = false;

  function updateSize(x, y) {
    width = x;
    height = y;
    canvas.width = x;
    canvas.height = y;
  }

  function move(x, y) {
    x += sizeX / 2;
    cursor.x = x;
    cursor.y = y;
    if (!cursorsInitted) {
      cursorsInitted = true;
      for (let i = 0; i < totalParticles; i++) {
        addParticle(x, y);
      }
    }
  }

  class Particle {
    constructor(x, y) {
      this.position = { x, y };
    }
  }

  function addParticle(x, y) {
    particles.push(new Particle(x, y));
  }

  function calculatePosition() {
    let x = cursor.x,
      y = cursor.y;

    const particleCount = particles.length;
    for (let i = 0; i < particleCount; i++) {
      const nextParticlePos = (particles[i + 1] || particles[0]).position;
      const particlePos = particles[i].position;

      particlePos.x = x;
      particlePos.y = y;

      x += (nextParticlePos.x - particlePos.x) * 0.41;
      y += (nextParticlePos.y - particlePos.y) * 0.25;
    }
  }

  function drawPath() {
    context.beginPath();
    context.fillStyle = particlesColor;
    context.globalAlpha = 1.0;

    for (let particleIndex = 0; particleIndex < totalParticles; particleIndex++) {
      const pos = particles[particleIndex].position;
      const distance = Math.sqrt(
        Math.pow(cursor.x - pos.x, 2) + Math.pow(cursor.y - pos.y, 2)
      );
      const maxDistance = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
      const sizeFactor = 1 - distance / maxDistance;

      context.lineWidth = Math.min(sizeX, sizeY) * sizeFactor;

      if (particleIndex == 0) {
        context.moveTo(pos.x, pos.y);
      } else {
        context.lineTo(pos.x, pos.y);
      }
    }
    for (let particleIndex = totalParticles - 1; particleIndex >= 0; particleIndex--) {
      const pos = particles[particleIndex].position;
      context.lineTo(pos.x, pos.y + sizeY);
    }
    context.closePath();
    context.fill();

    context.beginPath();
    context.lineJoin = 'round';
    context.strokeStyle = particlesColor;
    context.lineWidth = Math.min(sizeX, sizeY);
    let offset = -sizeX / 2 + sizeY / 2;
    for (let particleIndex = 0; particleIndex < totalParticles; particleIndex++) {
      const pos = particles[particleIndex].position;
      if (particleIndex === 0) {
        context.moveTo(pos.x, pos.y + offset);
      } else {
        context.lineTo(pos.x, pos.y + offset);
      }
    }
    context.stroke();
  }

  let lastMinX = Infinity, lastMinY = Infinity, lastMaxX = -Infinity, lastMaxY = -Infinity;

  function updateParticles() {
    if (!cursorsInitted) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    particles.forEach((particle) => {
      minX = Math.min(minX, particle.position.x);
      minY = Math.min(minY, particle.position.y);
      maxX = Math.max(maxX, particle.position.x);
      maxY = Math.max(maxY, particle.position.y);
    });

    if (minX !== lastMinX || minY !== lastMinY || maxX !== lastMaxX || maxY !== lastMaxY) {
      const padding = 10;
      context.clearRect(
        minX - padding,
        minY - padding,
        maxX - minX + sizeX + 2 * padding,
        maxY - minY + sizeY + 2 * padding
      );
      lastMinX = minX;
      lastMinY = minY;
      lastMaxX = maxX;
      lastMaxY = maxY;
    }

    calculatePosition();
    drawPath();
  }

  function updateCursorSize(newSize, newSizeY) {
    sizeX = newSize;
    if (newSizeY) sizeY = newSizeY;
  }

  return {
    updateParticles,
    move,
    updateSize,
    updateCursorSize,
  };
};

const createCursorHandler = async (handlerFunctions) => {
  let editor;
  while (!editor) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    editor = document.querySelector('.part.editor');
  }
  handlerFunctions?.onStarted(editor);

  let updateHandlers = [];
  let cursorId = 0;
  let lastObjects = {};
  let lastCursor = 0;

  const createCursorUpdateHandler = (target, cursorId, cursorHolder, minimap) => {
    let lastX, lastY;
    const update = (editorX, editorY) => {
      if (!lastObjects[cursorId]) {
        updateHandlers.splice(updateHandlers.indexOf(update), 1);
        return;
      }

      const { left: newX, top: newY } = target.getBoundingClientRect();
      let revX = newX - editorX,
        revY = newY - editorY;

      if (revX == lastX && revY == lastY && lastCursor == cursorId) return;
      lastX = revX;
      lastY = revY;

      if (revX <= 0 || revY <= 0) return;
      if (target.style.visibility == 'hidden') return;
      if (minimap && minimap.offsetWidth != 0 && minimap.getBoundingClientRect().left <= newX) return;
      if (cursorHolder.getBoundingClientRect().left > newX) return;

      lastCursor = cursorId;
      handlerFunctions?.onCursorPositionUpdated(revX, revY);
      handlerFunctions?.onCursorSizeUpdated(target.clientWidth, target.clientHeight);
    };
    updateHandlers.push(update);
  };

  let lastVisibility = 'hidden';
  let lastCursorCount = 0;

  const updateCursors = () => {
    let now = [], count = 0;
    const cursorElements = editor.getElementsByClassName('cursor');
    for (const target of cursorElements) {
      if (target.style.visibility != 'hidden') count++;
      if (target.hasAttribute('cursorId')) {
        now.push(+target.getAttribute('cursorId'));
        continue;
      }
      let thisCursorId = cursorId++;
      now.push(thisCursorId);
      lastObjects[thisCursorId] = target;
      target.setAttribute('cursorId', thisCursorId);
      let cursorHolder = target.parentElement.parentElement.parentElement;
      let minimap = cursorHolder.parentElement.querySelector('.minimap');
      createCursorUpdateHandler(target, thisCursorId, cursorHolder, minimap);
    }

    if (count !== lastCursorCount) {
      let visibility = count <= 1 ? 'visible' : 'hidden';
      if (visibility != lastVisibility) {
        handlerFunctions?.onCursorVisibilityChanged(visibility);
        lastVisibility = visibility;
      }
      lastCursorCount = count;
    }

    for (const id in lastObjects) {
      if (now.includes(+id)) continue;
      delete lastObjects[+id];
    }
    requestAnimationFrame(updateCursors);
  };
  requestAnimationFrame(updateCursors);

  function updateLoop() {
    let { left: editorX, top: editorY } = editor.getBoundingClientRect();
    for (const handler of updateHandlers) handler(editorX, editorY);
    handlerFunctions?.onLoop();
    requestAnimationFrame(updateLoop);
  }

  function updateEditorSize() {
    handlerFunctions?.onEditorSizeUpdated(editor.clientWidth, editor.clientHeight);
  }
  new ResizeObserver(updateEditorSize).observe(editor);
  updateEditorSize();

  updateLoop();
  handlerFunctions?.onReady();
};

let cursorCanvas, rainbowCursorHandle;
createCursorHandler({

  onStarted: (editor) => {
    cursorCanvas = document.createElement('canvas');
    cursorCanvas.style.pointerEvents = 'none';
    cursorCanvas.style.position = 'absolute';
    cursorCanvas.style.top = '0px';
    cursorCanvas.style.left = '0px';
    cursorCanvas.style.zIndex = '1000';
    editor.appendChild(cursorCanvas);

    rainbowCursorHandle = createTrail({
      length: CONFIG.trailLength,
      color: CONFIG.color,
      size: CONFIG.size,
      canvas: cursorCanvas
    });
  },

  onCursorPositionUpdated: (x, y) => {
    rainbowCursorHandle.move(x, y);
  },

  onEditorSizeUpdated: (x, y) => {
    rainbowCursorHandle.updateSize(x, y);
  },

  onCursorSizeUpdated: (x, y) => {
    rainbowCursorHandle.updateCursorSize(x, y);
  },

  onCursorVisibilityChanged: (visibility) => {
    cursorCanvas.style.visibility = visibility;
  },

  onLoop: () => {
    rainbowCursorHandle.updateParticles();
  }
});
