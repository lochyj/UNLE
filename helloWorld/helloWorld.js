const url = "helloWorld.wasm";
const importObject = {
  imports: {
    imported_func(arg) {
      console.log(arg);
    },
  },
};
WebAssembly.instantiateStreaming(fetch(url), importObject).then((result) => {
  const { get_90 } = result.instance.exports;
  console.log(get_90());
  // Expected output: 90
});
