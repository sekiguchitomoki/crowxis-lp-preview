/* Crowxis LP — パスワードゲート（限定公開プレビュー用・本番では不要） */
(function(){
  var HASH = '7cd0a8196742924558d70f3c640536dcf33f6e0e33567f93f2d62d153bb6c453';
  var gate = document.getElementById('pwGate');
  if(sessionStorage.getItem('cx_auth') === '1'){ gate.remove(); return; }
  function sha256(s){
    var b = new TextEncoder().encode(s);
    return crypto.subtle.digest('SHA-256', b).then(function(h){
      return Array.prototype.map.call(new Uint8Array(h), function(x){ return x.toString(16).padStart(2,'0'); }).join('');
    });
  }
  document.getElementById('pwForm').addEventListener('submit', function(ev){
    ev.preventDefault();
    var v = document.getElementById('pwInput').value;
    sha256(v).then(function(h){
      if(h === HASH){
        sessionStorage.setItem('cx_auth','1');
        location.reload();               // 認証後は最初から（オープニングムービーから）再生
      }else{
        document.getElementById('pwErr').textContent = 'パスワードが違います';
        var box = gate.querySelector('.pw-box');
        box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      }
    });
  });
})();
