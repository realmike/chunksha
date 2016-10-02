var expect = require('expect.js');
var ChunkSha256 = require('../src/sha256.js');
var chunkSha256 = new ChunkSha256();

describe('ChunkSha256 computation', function () {

    it('arrayBuffer with string abc', function () {
        var buffer1 = new ArrayBuffer(3);
        var view1 = new Int8Array(buffer1);
        view1[0] = 97;
        view1[1] = 98;
        view1[2] = 99;

        var expectedAbcHex = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
        var expectedBuffer = new ArrayBuffer(32);
        var expectedAbcHashedInt8Array = new Int8Array(expectedBuffer);

        for (i = 0; i < 32; i++) {
            expectedAbcHashedInt8Array[i] = parseInt(expectedAbcHex.substring(i * 2, (i + 1) * 2, 16));
        }

        var chunkSha256 = new ChunkSha256();
        chunkSha256.update(buffer1);
        expect(chunkSha256.get()).to.eql(expectedBuffer);
        expect(chunkSha256.getHex()).to.equal(expectedAbcHex)
    });


    it('arrayBuffer with empty string', function () {
        var buffer1 = new ArrayBuffer(0);

        var expectedAbcHex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        var expectedBuffer = new ArrayBuffer(32);
        var expectedAbcHashedInt8Array = new Int8Array(expectedBuffer);

        for (i = 0; i < 32; i++) {
            expectedAbcHashedInt8Array[i] = parseInt(expectedAbcHex.substring(i * 2, (i + 1) * 2, 16));
        }

        var chunkSha256 = new ChunkSha256();
        chunkSha256.update(buffer1);
        expect(chunkSha256.get()).to.eql(expectedBuffer);
        expect(chunkSha256.getHex()).to.equal(expectedAbcHex)
    });

});
describe('rotr', function() {
    it('rotr by 2', function() {
        expect(chunkSha256.rotr(parseInt('00000000000000000000000011010000', 2), 2)).to.equal(parseInt('00000000000000000000000000110100', 2));
    });
    it('rotr by 6', function() {
        expect(chunkSha256.rotr(parseInt('00000000000000000000000011010000', 2), 6)).to.equal(parseInt('01000000000000000000000000000011', 2));
    });
});



