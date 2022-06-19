import{i as s,_ as S,d as _,s as g,h as c,o as i,f as m,n as d,r as b,v as h,x as v,y as V,b as z}from"./entry-1567ad96.mjs";const k=(r,t,o)=>s({get(){return r[t]},set(e){o(`update:${t}`,e)}}),w=_({__name:"TextInput",props:{modelValue:{type:String,default:""},placeholder:{type:String,default:""},size:{type:String,default:"md"}},emits:["update:modelValue"],setup(r,{expose:t,emit:o}){t();const e=r,n=g(),a=`
  outline-none 
  transition-color duration-300 
  bg-transparent border border-gray-900/10 dark:border-gray-50/[0.2] 
  dark:focus:border-white focus:border-gray-900
`,l=c({lg:"h-12 px-4 text-lg",md:"h-10 px-4 text-base",sm:"h-8 px-4 text-sm",xs:"h-7 px-4 text-xs"}),x=c({lg:"rounded-lg",md:"rounded-lg",sm:"rounded-lg",xs:"rounded-lg"}),u=k(e,"modelValue",o),f=s(()=>l[e.size]||l.md),y=s(()=>n.prefix?"rounded-r":"rounded"),p={props:e,emit:o,slots:n,defaultStyle:a,sizeStyles:l,wrapperSizeStyles:x,modelValue:u,selectedSize:f,inputRondedStyle:y,onInput:()=>o("update:modelValue",u.value)};return Object.defineProperty(p,"__isScriptSetup",{enumerable:!1,value:!0}),p}}),I=["placeholder"];function B(r,t,o,e,n,a){return i(),m("div",{class:d(`flex relative overflow-hidden ${e.wrapperSizeStyles}`)},[e.slots.prefix?(i(),m("div",{key:0,class:d(`px-4 py-2 rounded-l ${e.defaultStyle} ${e.selectedSize} bg-gray-100 dark:bg-slate-800 text-gray-500`)},[b(r.$slots,"prefix")],2)):h("",!0),v(z("input",{"onUpdate:modelValue":t[0]||(t[0]=l=>e.modelValue=l),type:"text",class:d(`flex-1 block w-full ${e.inputRondedStyle} ${e.defaultStyle} ${e.selectedSize}`),placeholder:o.placeholder,onInput:e.onInput},null,42,I),[[V,e.modelValue]])],2)}var P=S(w,[["render",B]]);export{P as _};
