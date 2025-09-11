/*********
 * made by Matthias Hurrle (@atzedent)
 */

const dpr = window.devicePixelRatio

function compile(shader, source) {
  gl.shaderSource(shader, source)
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
  }
}

let gl, programs = [],
vertices, buffer;

function setup() {
  gl = canvas.getContext("webgl2")
  const vs = gl.createShader(gl.VERTEX_SHADER)
  const vertexSource = document.querySelector('script[type="x-shader/x-vertex"]').innerText
  compile(vs, vertexSource)

  shaders = Array.from(document.querySelectorAll('script[type="x-shader/x-fragment"]')).map(e => e.innerText)
  programs = shaders.map(() => gl.createProgram())

  for (let i = 0; i < shaders.length; i++) {
    let addr = gl.createShader(gl.FRAGMENT_SHADER)
    let program = programs[i]

    compile(addr, shaders[i])
    gl.attachShader(program, vs)
    gl.attachShader(program, addr)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
    }
  }

  vertices = [
    -1.,-1.,1.,
    -1.,-1.,1.,
    -1., 1.,1.,
    -1., 1.,1.,
  ]

  buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  for (let program of programs) {
    const position = gl.getAttribLocation(program, "position")

    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    // uniforms come here...
    program.resolution = gl.getUniformLocation(program, "resolution")
    program.time = gl.getUniformLocation(program, "time")
    program.fade = gl.getUniformLocation(program, "fade")
  }
}

function dispose() {
  if (gl) {
    const ext = gl.getExtension("WEBGL_lose_context")
    if (ext) ext.loseContext()
    gl = null
  }
}

function draw(now, program, duration) {
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  // uniforms come here...
  gl.uniform2f(program.resolution, canvas.width, canvas.height)
  gl.uniform1f(program.time, now * 1e-3)
  gl.uniform1f(program.fade, fade)

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length * .5)
}

const styleList = ["zoom", "slide", "paper"]
const wordlist = [
  ["100X", "Knowledge", "Platform", ""],
  ["LOADING...", ""],
  ["", "", "", "", "", "", "","","","","","","","","","","","","","",""]
]

let handle, offset = 0,
iter = 0,
duration = 2500,
words = wordlist[iter % wordlist.length],
wordIndex = 0,
then = 0,
done = false,
fade = 0,
finished = false,
finalHoldStart = null

let postitShown = false
let otherImagesShown = false

function showPostit() {
  if (postitShown) return
  const img = document.createElement("img")
  img.id = "postit-note"
  img.src = "images/postit.png"
  img.alt = ""
  img.style.position = "fixed"
  img.style.top = "50%"
  img.style.left = "50%"
  img.style.transform = "translate(-50%, -50%)"
  img.style.width = "360px"
  img.style.zIndex = "10"
  img.style.pointerEvents = "none"
  img.style.transition = "transform 200ms ease, filter 200ms ease"
  document.body.appendChild(img)
  img.addEventListener("load", () => {
    const hit = document.createElement("div")
    hit.style.position = "fixed"
    hit.style.top = "50%"
    hit.style.left = "50%"
    hit.style.transform = "translate(-50%, -50%)"
    const hitW = Math.round(img.width * 0.7)
    const hitH = Math.round(img.height * 0.7)
    hit.style.width = hitW + "px"
    hit.style.height = hitH + "px"
    hit.style.zIndex = "11"
    hit.style.cursor = "pointer"
    hit.style.pointerEvents = "auto"
    hit.addEventListener("mouseenter", () => {
      img.style.transform = "translate(-50%, -50%) scale(1.05)"
      img.style.filter = "drop-shadow(0 8px 18px rgba(0,0,0,.25))"
    })
    hit.addEventListener("mouseleave", () => {
      img.style.transform = "translate(-50%, -50%)"
      img.style.filter = "none"
    })
    hit.addEventListener("click", () => {
      window.location.href = "https://visoai.space"
    })
    document.body.appendChild(hit)
  })
  postitShown = true
}

function showOtherImages() {
  if (otherImagesShown) return
  const placements = [
    { src: "images/math1.png", top: "8%", left: "4%", width: "180px" },
    { src: "images/math2.png", top: "10%", right: "6%", width: "170px" },
    { src: "images/math3.png", top: "28%", left: "18%", width: "200px" },
    { src: "images/math4.png", top: "30%", right: "16%", width: "320px" },
    { src: "images/math5.webp", bottom: "8%", left: "10%", width: "220px" },
    { src: "images/mathscribbes.png", bottom: "12%", right: "8%", width: "180px" },
    { src: "images/scribbes2.png", top: "55%", right: "12%", width: "140px" },
    { src: "images/chemistry.webp", bottom: "22%", right: "18%", width: "400px" },
    { src: "images/chemistry2.webp", bottom: "26%", left: "22%", width: "320px" },
    { src: "images/chemistry3.png", top: "65%", left: "6%", width: "380px" },
    { src: "images/paper_airplane.webp", top: "50%", left: "50%", width: "150px", transform: "translate(-50%, -50%)" }
  ]

  for (const p of placements) {
    const img = document.createElement("img")
    img.src = p.src
    img.alt = ""
    img.style.position = "fixed"
    if (p.top) img.style.top = p.top
    if (p.right) img.style.right = p.right
    if (p.bottom) img.style.bottom = p.bottom
    if (p.left) img.style.left = p.left
    if (p.transform) img.style.transform = p.transform
    img.style.width = p.width || "140px"
    img.style.zIndex = "9"
    img.style.pointerEvents = "none"
    document.body.appendChild(img)
  }

  otherImagesShown = true
}

function loop(now) {
  now = now - offset
  fade = speak(now)

  // Final scene: finish immediately when complete
  if (iter >= programs.length - 1 && fade >= 1) {
    finished = true
  }

  draw(now, programs[iter % programs.length], fade)

  if (fade >= 1) {
    // If we just completed a non-final scene, advance to next
    if (iter < programs.length - 1) {
      offset += now
      fade = 0,
      then = 0,
      done = false,
      wordIndex = 0,
      words = wordlist[++iter % wordlist.length]

      // If we just entered the final scene, show the post-it image
      if (iter >= programs.length - 1) {
        showPostit()
        showOtherImages()
      }
    }
  }

  if (!finished) {
    handle = requestAnimationFrame(loop)
  } else {
    window.location.href = "https://visoai.space"
  }
}

function init() {
  dispose()
  setup()
  resize()
  finished = false
  loop(0)
}

function resize() {
  const {
    innerWidth: width,
    innerHeight: height
  } = window

  canvas.width = width * dpr
  canvas.height = height * dpr

  gl.viewport(0, 0, width * dpr, height * dpr)
}

function speak(now) {
  let timeout = duration,
  factor = 250,
  prog = iter % programs.length
  if (prog === 2) {
    timeout = 1000
    factor = 500
  }
  if (!done && (now - then) >= timeout) {
    done = now / (timeout * words.length) >= 1
    then = now
    if (wordIndex === 0) {
      titles.innerHTML = ""
    }
    const word = words[wordIndex++ % words.length]
    const span = document.createElement("span")
    span.classList.add(styleList[iter % styleList.length])
    span.dataset.text = word
    span.innerText = word
    if (word === "100X") {
      span.style.color = "#000"
    }
    if (word === "Platform") {
      span.style.color = "#000"
    }
    if (word === "Knowledge") {
      span.style.color = "#000"
    }
    titles.appendChild(span)
  }

  fade = now / ((timeout + factor) * words.length)

  return fade
}

window.onload = init
window.onresize = resize