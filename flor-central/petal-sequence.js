// F05: prescribed kinematic sequence, SI units. No material dynamics inferred.
export const SEQUENCE=Object.freeze({durationS:41,floweringStartS:11,floweringDurationS:30,storedCrownM:1.77,raisedCrownM:10.15,rootAboveCrownM:.23,rootZM:.95,stageTopM:2.75,deckM:.18,hatchXM:4.2,hatchZM:3.7});
const clip=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clip(x);return x*x*(3-2*x);},phase=(t,a,b)=>smooth((t-a)/(b-a));
export function petalPose(timeS=0){
 const t=Math.max(0,Math.min(SEQUENCE.durationS,Number(timeS)||0));
 const rise=phase(t,3,11),orient=phase(t,11,17),fold=phase(t,17,29),lower=phase(t,29,41);
 const crownY=SEQUENCE.storedCrownM+(SEQUENCE.raisedCrownM-SEQUENCE.storedCrownM)*rise;
 return{timeS:t,trap:phase(t,0,3),rise,fold,pitchRad:(180-90*orient-90*lower)*Math.PI/180,crownY,rootM:[0,crownY+SEQUENCE.rootAboveCrownM,SEQUENCE.rootZM],platformFloorM:crownY-.4,phaseIndex:t<3?0:t<11?1:t<17?2:t<29?3:t<41?4:5};
}
export function rawToRoot(p,pitchRad){const c=Math.cos(pitchRad),s=Math.sin(pitchRad);return[p[1],p[0]*s+p[2]*c,p[0]*c-p[2]*s];}
export const PHASES=[
 ['Abrir el paso','Las dos tapas rígidas giran primero. El pétalo sigue plegado hacia dentro y retenido por los frenos de sus ejes.'],
 ['Subir el paquete','Asciende el mismo conjunto compacto. La trampa ya está completamente abierta. La subida dibujada es una trayectoria prescrita, no una simulación de la Compact 12.'],
 ['Orientar el paquete','El cardán lleva el paquete desde su orientación interior hasta la vertical. No se despliega debajo de la trampa.'],
 ['Desplegar con accionamiento','Un accionamiento positivo en una bisagra maestra mueve el plegado articulado. Dar cable por sí solo no levanta el pétalo contra su peso.'],
 ['Abrir hacia fuera','Los ejes de raíz y el tambor controlan el giro hacia fuera. El cable sigue apoyado en la roldana y en la garganta del tambor.'],
 ['Mantener abierto','El pétalo permanece abierto. Capacidad de motores, frenos y uniones aún por dimensionar con materiales y masas reales.']
];
