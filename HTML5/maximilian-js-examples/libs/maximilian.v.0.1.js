
var initAudioEngine = (origin = document.location.origin+"/libs")=>{
  return new Promise((resolve, reject)=>{
    //Dynamically load modules
    import(origin + "/index.mjs").then((semaEngine)=>{
      import(origin + "/ringbuf.js").then((RingBuffer)=>{
        //Setup sema engine
        const Engine = semaEngine.Engine
        const Learner = semaEngine.Learner
        var maxi = new Engine();
        var inputBufferIds = []
        //init Engine
        maxi.init(origin).then(()=>{
          let learner = new Learner();
          maxi.addLearner('l1', learner);
          maxi.addSample = (name, url)=> {
            return maxi.loadSample(name + "----", url, true)
          }

          maxi.addEventListener('onSharedBuffer', (e) => {
            console.log("onSharedBuffer", e)
            let ringbuf = new RingBuffer.default(e.sab, Float64Array);
            maxi.sharedArrayBuffers[e.channelID] = {
              sab: e.sab,
              rb: ringbuf,
              blocksize:e.blocksize
            };
          });

          let pollRate = 10;
          function sabPrinter() {
            try {
              //Only check if we need to (e.g. they have defined a callback)
              if(maxi.onInput !== undefined) {
                for (let v in maxi.sharedArrayBuffers) {
                  if(!inputBufferIds.includes(v)) {
                    let avail = maxi.sharedArrayBuffers[v].rb.available_read();
                    if ( avail > 0 && avail != maxi.sharedArrayBuffers[v].rb.capacity) {
                      for (let i = 0; i < avail; i += maxi.sharedArrayBuffers[v].blocksize) {
                        let elements = new Float64Array(maxi.sharedArrayBuffers[v].blocksize);
                        let val = maxi.sharedArrayBuffers[v].rb.pop(elements);
                        if(maxi.onInput) {
                          maxi.onInput(v,elements)
                        }
                      }
                    }
                  }
                }
              }
              setTimeout(sabPrinter, pollRate);
            } catch (error) {
              setTimeout(sabPrinter, pollRate);
            }
          }
          sabPrinter()

          maxi.send = (id, data)=> {
            if(maxi.sharedArrayBuffers[id] === undefined) {
              inputBufferIds.push(id)
              maxi.createSharedBuffer(id, "ML", data.length);
              console.log(maxi.sharedArrayBuffers)
            }
            maxi.pushDataToSharedBuffer(id, data);
          }

          let getCode = async (location)=> {
            //Try script element
            let scriptElement = document.getElementById(location)
            if(scriptElement !== null)
            {
              return scriptElement.innerHTML
            }
            else
            {
              //Else try url
              console.log("try url")
              function isValidURL(url) {
                try {
                  new URL(url);
                  return true;
                } catch (error) {
                  return false;
                }
              }
              if(isValidURL(location)) {
                let response = await fetch(location);
                if (response.ok) {
                  let text = await response.text();
                  console.log("executing http code")
                  return text
                }
              }
              else {
                //Else use string literal
                console.log("executing literal code")
                return location
              }
            }
          }

          let filterCode = (code)=> {
            code = code.replace(/Maximilian/g, "Module");
              //Mimic site adds in some stuff for consoles, causes errors, remove it
            code = code.replace(/parent.postMessage\(\[\"console\".*\"\*\"\)/g, "");
            return code
          }

          maxi.updateSignal = async (location, name)=> {
            let code = await getCode(location)
            code = filterCode(code)
            let dspCode = {}
            dspCode.loop = {}
            dspCode.loop[name] = code
            setTimeout(()=>{
              maxi.eval(dspCode)
            },50);
          }

          let evalCode = async(code)=> {
            console.log("code", code)
            let dspCode = {}
            dspCode.setup = `()=>{
              let q = this.newq();
              let createDSPLoop = ()=> {
                ` 
                + code +
                ` 

                return play;
              }
              q.play = createDSPLoop();
              return q;
            }`
            dspCode.loop = `(q, inputs, mem) => {
              var sig = q.play(inputs);
              return sig
            }`
            setTimeout(()=>{
              maxi.eval(dspCode)
            },50);
          }

          maxi.executeOnce = async (location)=>{
            let code = await getCode(location)
            code = filterCode(code)
            evalCode(code)
          }

          maxi.setAudioCode = async (location)=>{
            maxi.executeOnce(location)
          }

          resolve(maxi)
        })
      })
    })
  })
}

// const regex = /(let|var|const)\s+play\s*=\s*\([^)]*\)\s*=>\s*{([^}]*)}/g;
// let code = await getCode(location)
// let playFunction = code.match(regex)[0]
// console.log("playFunction",playFunction)
// let otherCode = code.replace(regex,"")
// maxi.setAudioCode("setup", otherCode)
// setTimeout(()=>{
//     maxi.setAudioCode("signal", playFunction)
//   },100);