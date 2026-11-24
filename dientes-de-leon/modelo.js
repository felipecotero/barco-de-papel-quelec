// Unidad de taller en metros. El origen de cada fruto es su inserción en el receptáculo.
export function crearModelo(T) {
  const centro = 1.80;
  const radioNucleo = 0.044;
  const cantidad = 118;
  const vuelta = 2 * Math.PI;
  const grupo = new T.Group();
  grupo.name = 'Estandarte de diente de león';
  const vectorY = new T.Vector3(0, 1, 0);
  const matriz = new T.Matrix4();
  const uno = new T.Vector3(1, 1, 1);
  const cero = new T.Vector3();
  const color = valor => new T.Color(valor);
  const rgb = (lista, tono) => lista.push(tono.r, tono.g, tono.b);
  function malla(geometria, material, nombre, padre = grupo) {
    const objeto = new T.Mesh(geometria, material);
    objeto.name = nombre;
    padre.add(objeto);
    return objeto;
  }
  function materialSuperficie(aspereza) {
    return new T.MeshStandardMaterial({vertexColors: true, roughness: aspereza});
  }
  function geometria(posiciones, colores, indices) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(posiciones, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(colores, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
  // Superficie de revolución con pigmento y relieve longitudinal independientes.
  function torneado(perfil, lados, tono, relieve = () => 1, eje = () => 0) {
    const puntos = [], colores = [], indices = [];
    perfil.forEach(([y, radio], fila) => {
      for (let i = 0; i < lados; i++) {
        const a = i * vuelta / lados;
        const r = radio * relieve(a, y);
        puntos.push(eje(y) + r * Math.cos(a), y, r * Math.sin(a));
        rgb(colores, tono(a, y));
        if (fila === perfil.length - 1) continue;
        const p = fila * lados + i, q = fila * lados + (i + 1) % lados;
        indices.push(p, p + lados, q, q, p + lados, q + lados);
      }
    });
    return geometria(puntos, colores, indices);
  }
  const madera = color(0x544337), veta = color(0x9c8663);
  const vara = torneado([
    [0, 0.0108], [0.005, 0.012], [0.45, 0.012], [1.38, 0.0109], [1.72, 0.010], [centro, 0.0093]
  ], 64, (a, y) => madera.clone().lerp(veta, .4 + .19 * Math.cos(16 * a + y * 1.2) + .14 * Math.sin(7 * a - y * 3)));
  malla(vara, materialSuperficie(.71), 'Vara de 180 cm');
  const laton = new T.MeshStandardMaterial({color: 0x98805b, metalness: .38, roughness: .46});
  function casquillo(y, r, largo) {
    const aro = malla(new T.CylinderGeometry(r, r * 1.02, largo, 32), laton, 'Casquillo');
    aro.position.y = y;
  }
  casquillo(.010, .0123, .020);
  casquillo(centro - .079, .0109, .019);

  // Receptáculo visible al dispersar los frutos, con una huella de inserción por cada uno.
  const materialCentro = new T.MeshStandardMaterial({
    color: 0xd6ad66, roughness: .62, emissive: 0xffbd65, emissiveIntensity: .85
  });
  const nucleo = malla(new T.SphereGeometry(radioNucleo, 44, 26), materialCentro, 'Receptáculo luminoso');
  nucleo.position.y = centro;
  const luzInterna = new T.PointLight(0xffc787, .25, .78, 1.6);
  luzInterna.position.copy(nucleo.position);
  grupo.add(luzInterna);
  const materialHalo = new T.ShaderMaterial({
    uniforms: {tono: {value: color(0xffb564)}}, transparent: true, depthWrite: false,
    blending: T.AdditiveBlending,
    vertexShader: `
      varying vec2 coord;
      void main(){
        coord=uv*2.0-1.0;
        vec4 centroVista=modelViewMatrix*vec4(0.,0.,0.,1.);
        centroVista.xy+=position.xy;
        gl_Position=projectionMatrix*centroVista;
      }`,
    fragmentShader: `
      uniform vec3 tono; varying vec2 coord;
      void main(){
        float r=length(coord);
        float a=exp(-r*r*6.0)*(1.0-smoothstep(0.75,1.0,r));
        gl_FragColor=vec4(tono,0.38*a);
        #include <colorspace_fragment>
      }`
  });
  const halo = malla(new T.PlaneGeometry(.31,.31), materialHalo, 'Luz alrededor del receptáculo');
  halo.position.copy(nucleo.position);
  const verde = color(0x536744), pajizo = color(0xc9a16b), nervio = color(0x9ca471);
  const puntosBractea = [], coloresBractea = [], indicesBractea = [];
  for (let i = 0; i < 13; i++) {
    const primero = puntosBractea.length / 3;
    const a = vuelta * i / 13;
    const longitud = .063 + .011 * Math.sin(10.3*i);
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      const r = .016 + .062 * Math.sin(t * 1.75);
      const y = centro - .041 - longitud * t + .015 * Math.sin(Math.PI*t);
      const ancho = .00045 + .0087 * Math.pow(Math.sin(Math.PI*t),.8);
      for (let k = -1; k <= 1; k++) {
        const ang = a + .095*t*t;
        puntosBractea.push(r*Math.cos(ang) - k*ancho*Math.sin(ang), y + (k===0 ? .003 : 0), r*Math.sin(ang) + k*ancho*Math.cos(ang));
        rgb(coloresBractea, verde.clone().lerp(nervio,k === 0 ? .62 : .12).lerp(pajizo, t*t*t*.75));
      }
      if (j < 14) for (let k = 0; k < 2; k++) {
        const n = primero + 3*j + k;
        indicesBractea.push(n,n+3,n+1,n+1,n+3,n+4);
      }
    }
  }
  const materialBracteas = materialSuperficie(.83);
  materialBracteas.side = T.DoubleSide;
  malla(geometria(puntosBractea,coloresBractea,indicesBractea),materialBracteas,'Brácteas reflejas');

  const caramelo = color(0x88552e), ocre = color(0xb78a4b), marfil = color(0xe3cd9f);
  const cuerpo = torneado([
    [0,.0013], [.004,.0032], [.012,.0047], [.025,.0053], [.035,.0049], [.042,.0032], [.047,.0016]
  ], 56, (a,y) => caramelo.clone().lerp(ocre,.22 + .47 * (.5 + .5*Math.cos(8*a)) + y*3),
  (a,y) => 1 + .11*Math.cos(8*a + .18*y/.047) + .034*Math.cos(16*a));
  const cuerpoMat = materialSuperficie(.81);
  // Pequeños dientes en la parte distal del fruto seco.
  const pDientes=[], cDientes=[], iDientes=[];
  for (let fila = 0; fila < 3; fila++) for (let i = 0; i < 8; i++) {
    const a = vuelta*(i/8 + fila*.025);
    const y = .026 + fila*.0043;
    const r = (.0055 - fila*.00015);
    const n = pDientes.length/3;
    for (const [ang,altura,radio] of [[a-.14,y,r],[a+.14,y,r],[a,y+.001,r+.00054],[a+.03,y+.0038,r+.00148]]) {
      pDientes.push(Math.cos(ang)*radio, altura, Math.sin(ang)*radio);
      rgb(cDientes, ocre);
    }
    iDientes.push(n,n+2,n+3,n+2,n+1,n+3);
  }
  const dientes = geometria(pDientes,cDientes,iDientes);
  const extremoPico = .2623;
  const inclinacionPico = y => .0023*Math.sin(Math.PI * (y - .047) / (extremoPico-.047));
  const pico = torneado([[.046,.00165],[.059,.00144],[.11,.00118],[.17,.0010],[.224,.00095],[extremoPico-.002,.00105],[extremoPico,.00185]],12,
    (a,y) => ocre.clone().lerp(marfil, .2 + .74*y/extremoPico), () => 1, inclinacionPico);
  const picoMat = materialSuperficie(.63);

  // Cintas de seda orientadas a cámara: conservan su espesor métrico al acercarse,
  // y su cobertura subpíxel al alejarse, incluso en pantallas de alta densidad.
  const materialSedoso = new T.ShaderMaterial({
    transparent:true, depthWrite:false, side:T.DoubleSide, forceSinglePass:true,
    uniforms:{resolucion:{value:new T.Vector2(1400,800)},densidad:{value:1},encendido:{value:1}},
    vertexShader:`
      attribute vec3 rumbo;
      attribute vec3 seda;
      attribute float banda;
      attribute float grueso;
      uniform vec2 resolucion;
      uniform float densidad;
      varying float lado;
      varying float cobertura;
      varying vec3 tono;
      void main(){
        mat4 vista=modelViewMatrix;
        #ifdef USE_INSTANCING
          vista=vista*instanceMatrix;
        #endif
        vec4 clip=projectionMatrix*vista*vec4(position,1.);
        vec4 otro=projectionMatrix*vista*vec4(position+.008*rumbo,1.);
        vec2 tangente=(otro.xy/max(otro.w,.0001)-clip.xy/max(clip.w,.0001))*resolucion;
        vec2 normal=vec2(-tangente.y,tangente.x)/max(length(tangente),.00001);
        float realPx=grueso*projectionMatrix[1][1]*resolucion.y/(2.0*max(clip.w,.0001));
        float minPx=.73*densidad;
        float ancho=max(minPx,realPx);
        clip.xy+=banda*normal*2.0*ancho/resolucion*clip.w;
        lado=banda;
        cobertura=clamp(realPx/minPx,0.16,1.0);
        tono=seda;
        gl_Position=clip;
      }`,
    fragmentShader:`
      varying vec3 tono; varying float lado; varying float cobertura;
      uniform float encendido;
      void main(){
        float borde=1.0-smoothstep(.28,1.,abs(lado));
        gl_FragColor=vec4(tono*mix(.84,1.06,encendido),borde*cobertura*.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  function geometriaVilano(variante) {
    const puntos=[], rumbos=[], lados=[], grosores=[], colores=[], indices=[];
    const crema=color(0xe3cda2), nieve=color(0xfffaf0);
    const numero=67 + 2*variante;
    for(let i=0;i<numero;i++){
      const ruido=Math.sin(i*36.613 + variante*7.271);
      const a=vuelta*(i+.30*ruido)/numero;
      const largo=.057 + .0080*ruido + .004*Math.sin(5*a);
      const subida=.031 + .006*Math.cos(3*a+variante) + .006*Math.sin(i*9.871+variante);
      const giro=.16*Math.sin(2*a+variante) + .20*ruido;
      const curva=t=>{
        const ang=a+giro*t*t + .07*Math.cos(8*a+variante)*Math.sin(Math.PI*t);
        const r=largo*t;
        return new T.Vector3(r*Math.cos(ang),extremoPico+subida*(.28*t+.72*t*t)+.003*Math.sin(Math.PI*t)+.0025*Math.sin(4*a+ruido)*t*t,r*Math.sin(ang));
      };
      const raiz=puntos.length/3;
      for(let j=0;j<=7;j++){
        const t=j/7, p=curva(t), rumbo=curva(t+.001).sub(curva(t-.001)).normalize();
        const pigmento=crema.clone().lerp(nieve,.34+.56*t+.08*ruido);
        for(const lado of [-1,1]){
          puntos.push(p.x,p.y,p.z); rumbos.push(rumbo.x,rumbo.y,rumbo.z);
          lados.push(lado); grosores.push((.00039-.00024*t)*(.93+.10*ruido)); rgb(colores,pigmento);
        }
        if(j<7){
          const n=raiz+2*j;
          indices.push(n,n+2,n+1,n+1,n+2,n+3);
        }
      }
    }
    const g = new T.BufferGeometry();
    for (const [nombre, valores, ancho] of [['position',puntos,3],['rumbo',rumbos,3],['seda',colores,3],['banda',lados,1],['grueso',grosores,1]]) {
      g.setAttribute(nombre,new T.Float32BufferAttribute(valores,ancho));
    }
    g.setIndex(indices);
    g.computeBoundingSphere();
    return g;
  }
  const componentes=[[cuerpo,cuerpoMat,'Fruto estriado'],[dientes,cuerpoMat,'Dientes del fruto'],[pico,picoMat,'Pico del fruto']];
  const vilanos = Array.from({length:4},(_,i)=>geometriaVilano(i));
  function configurarSeda(objeto) {
    objeto.renderOrder=2;
    objeto.onBeforeRender=renderer=>{
      renderer.getDrawingBufferSize(materialSedoso.uniforms.resolucion.value);
      materialSedoso.uniforms.densidad.value=renderer.getPixelRatio();
    };
    return objeto;
  }
  function crearDetalle(){
    const detalle=new T.Group();
    detalle.name='Fruto con pico y vilano';
    for (const [geo,mat,nombre] of componentes) malla(geo,mat,nombre,detalle);
    configurarSeda(malla(vilanos[0],materialSedoso,'Vilano',detalle));
    return detalle;
  }
  const semillas=[], escalas=[], instancias=[], instanciasVilanos=[];
  const ranura=new T.InstancedMesh(new T.CylinderGeometry(.0037,.0033,.0016,12),new T.MeshStandardMaterial({color:0x937341,emissive:0x5e4022,emissiveIntensity:.32,roughness:.8}),cantidad);
  ranura.name='Puntos de inserción de los frutos';
  grupo.add(ranura);
  function lote(geo,mat,n,nombre){
    const objeto=new T.InstancedMesh(geo,mat,n);
    objeto.name=nombre;
    objeto.instanceMatrix.setUsage(T.DynamicDrawUsage);
    // El recinto de reposo cambia con cada soplo; no recortar una diáspora en vuelo.
    objeto.frustumCulled=false;
    grupo.add(objeto);
    return objeto;
  }
  for(const [geo,mat,nombre] of componentes) instancias.push(lote(geo,mat,cantidad,nombre));
  vilanos.forEach((geo,i)=>{
    const cuenta=Math.ceil((cantidad-i)/vilanos.length);
    instanciasVilanos.push(configurarSeda(lote(geo,materialSedoso,cuenta,'Vilanos')));
  });
  let repintar=false;
  function aplicarPose(i,posicion,orientacion,visible=true){
    matriz.compose(posicion,orientacion,visible?escalas[i]:cero);
    for(const lote of instancias) lote.setMatrixAt(i,matriz);
    instanciasVilanos[i%vilanos.length].setMatrixAt(Math.floor(i/vilanos.length),matriz);
    repintar=true;
  }
  function actualizar(){
    if(!repintar)return;
    for(const lote of [...instancias,...instanciasVilanos]) lote.instanceMatrix.needsUpdate=true;
    repintar=false;
  }
  const anguloAureo=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<cantidad;i++){
    const y=1-(i+.50)/cantidad*1.946;
    const r=Math.sqrt(1-y*y), a=i*anguloAureo+.031*Math.sin(i*13.94);
    const direccion=new T.Vector3(r*Math.cos(a),y,r*Math.sin(a)).normalize();
    const posicion=direccion.clone().multiplyScalar(radioNucleo-.0020).add(nucleo.position);
    const orientacion=new T.Quaternion().setFromUnitVectors(vectorY,direccion);
    orientacion.multiply(new T.Quaternion().setFromAxisAngle(vectorY,i*2.17));
    semillas.push({posicion,orientacion,direccion});
    const variacion = .996 - .0172*y*y + .009*direccion.z*direccion.z + .017*Math.sin(i*78.23) + .012*Math.cos(i*19.24);
    escalas.push(new T.Vector3(1,variacion,1));
    matriz.compose(direccion.clone().multiplyScalar(radioNucleo-.0001).add(nucleo.position),orientacion,uno);
    ranura.setMatrixAt(i,matriz);
    aplicarPose(i,posicion,orientacion);
  }
  actualizar();
  function luz(estado){
    const encendida=Boolean(estado);
    luzInterna.visible=halo.visible=encendida;
    materialCentro.emissiveIntensity=encendida ? .85 : 0;
    materialSedoso.uniforms.encendido.value=encendida?1:0;
    ranura.material.emissiveIntensity=encendida ? .32 : 0;
  }
  return {grupo,semillas,aplicarPose,actualizar,luz,crearDetalle};
}
