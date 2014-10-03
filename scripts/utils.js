// Javascript汎用ユーティリティ

// 継承
// http://qiita.com/LightSpeedC/items/d307d809ecf2710bd957
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}
