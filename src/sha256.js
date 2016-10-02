(function (window) {

function checkEndian(){
    var a = new ArrayBuffer(4);
    var b = new Uint8Array(a);
    var c = new Uint32Array(a);
    b[0] = 0xa1;
    b[1] = 0xb2;
    b[2] = 0xc3;
    b[3] = 0xd4;
    if(c[0] == 0xd4c3b2a1) return "little endian";
    if(c[0] == 0xa1b2c3d4) return "big endian";
    else throw new Error("Something crazy just happened");
}

function ChunkSha256(debug, maxChunkSize) {
    this.endianness = checkEndian();
    this.debug = debug;
    this.BLOCK_SIZE = 64;
    this.block = new ArrayBuffer(this.BLOCK_SIZE);
    this.block8 = new Int8Array(this.block);
    this.block32 = new Int32Array(this.block);
    this.W_ArrayBuffer = new ArrayBuffer(64 * 4);
    this.W = new Uint32Array(this.W_ArrayBuffer);
    this.W8 = new Int8Array(this.W_ArrayBuffer);

    this.lastBlock;
    this.lastBlock8;
    this.lastBlock32;

    this.totalMsgLengthInBytes = 0;

    this.h_ab = new ArrayBuffer(8*4); // ...
    this.h = new Uint32Array(this.h_ab);
    this.h[0] = 0x6A09E667;
    this.h[1] = 0xBB67AE85;
    this.h[2] = 0x3C6EF372;
    this.h[3] = 0xA54FF53A;
    this.h[4] = 0x510E527F;
    this.h[5] = 0x9B05688C;
    this.h[6] = 0x1F83D9AB;
    this.h[7] = 0x5BE0CD19;

    this.k = [
        0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
        0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
        0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
        0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
        0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
        0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
        0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
        0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
        ];
}

ChunkSha256.prototype.rotr = function(n, b) {
    return (n >>> b) | (n << (32 - b));
};

ChunkSha256.prototype.processBlock = function () {
    if (this.block8.byteLength !== this.BLOCK_SIZE) {
        throw new Error('Wrong block size')
    }

    var A = this.h[0] | 0;
    var B = this.h[1] | 0;
    var C = this.h[2] | 0;
    var D = this.h[3] | 0;
    var E = this.h[4] | 0;
    var F = this.h[5] | 0;
    var G = this.h[6] | 0;
    var H = this.h[7] | 0;

    var i;
    for (i = 0; i < 16; i++) {
        if (this.endianness === 'little endian') {
            // flip bytes to big endiane only if little endiane platform
            this.W8[i * 4 + 0] = this.block8[i * 4 + 3];
            this.W8[i * 4 + 1] = this.block8[i * 4 + 2];
            this.W8[i * 4 + 2] = this.block8[i * 4 + 1];
            this.W8[i * 4 + 3] = this.block8[i * 4 + 0];
        } else {
            this.W8[i * 4 + 0] = this.block8[i * 4 + 0];
            this.W8[i * 4 + 1] = this.block8[i * 4 + 1];
            this.W8[i * 4 + 2] = this.block8[i * 4 + 2];
            this.W8[i * 4 + 3] = this.block8[i * 4 + 3];
        }

    }

    for (i = 16; i < 64; i++) {
        var s0 = this.rotr(this.W[i-15], 7) ^ this.rotr(this.W[i-15], 18) ^ (this.W[i-15] >>> 3);
        var s1 = this.rotr(this.W[i-2], 17) ^ this.rotr(this.W[i-2], 19) ^ (this.W[i-2] >>> 10);

        this.W[i] = (this.W[i-16] + s0 + this.W[i-7] + s1) | 0;
    }

    // main cycle
    for (i = 0; i < 64; i++) {
        var S0 = this.rotr(A, 2) ^ this.rotr(A, 13) ^ this.rotr(A, 22);
        var Ma = (A & B) ^ (A & C) ^ (B & C);
        var t2 = (S0 + Ma) | 0;
        var S1 = this.rotr(E, 6) ^ this.rotr(E, 11) ^ this.rotr(E, 25);
        var Ch = (E & F) ^ ((~E) & G);
        var t1 = (H + S1 + Ch + this.k[i] + this.W[i]) | 0;

        H = G;
        G = F;
        F = E;
        E = (D + t1) | 0;
        D = C;
        C = B;
        B = A;
        A = (t1 + t2) | 0;
    }

    this.h[0] += A;
    this.h[1] += B;
    this.h[2] += C;
    this.h[3] += D;
    this.h[4] += E;
    this.h[5] += F;
    this.h[6] += G;
    this.h[7] += H;
};

// as a  start chunk is ArrayBuffer
ChunkSha256.prototype.update = function (msgChunk) {
    var msgChunk8 = new Int8Array(msgChunk);

    if(this.lastBlock && this.lastBlock.byteLength + msgChunk.byteLength < this.BLOCK_SIZE) {
        // just create new lastBlock which will contain both
        newLastBlock = new ArrayBuffer(this.lastBlock.byteLength + msgChunk.byteLength);
        newLastBlock8 = new Int8Array(newLastBlock);
        newLastBlock8.set(this.lastBlock8);
        newLastBlock8.set(msgChunk8, this.lastBlock.byteLength);
        this.lastBlock = newLastBlock;
        this.lastBlock8 = newLastBlock8;
        return;
    }
    if(this.lastBlock && this.lastBlock.byteLength + msgChunk.byteLength === this.BLOCK_SIZE) {
        // copy the lastBlock and msgChunk into block
        this.block8.set(this.lastBlock8);
        this.block8.set(msgChunk8, this.lastBlock.byteLength)
        // process block
        this.processBlock();
        this.totalMsgLengthInBytes += this.BLOCK_SIZE;
        // set lastBlock = null
        this.lastBlock = null;
        this.lastBlockView = null;
        return;
    }

    var offset = 0;
    if(this.lastBlock && this.lastBlock.byteLength + msgChunk.byteLength > this.BLOCK_SIZE) {

        // first copy the lastBlock into block
        this.block8.set(this.lastBlock8);
        // fill the remaining portion of the block
        for (var i = this.lastBlock.byteLength; i < this.BLOCK_SIZE; i++) {
            this.block8[i] = msgChunk8[offset];
            offset++;
        }
        this.processBlock();
        this.totalMsgLengthInBytes += this.BLOCK_SIZE;
        this.lastBlock = null;
        this.lastBlockView = null;
    }


    // now process the next blocks as long as there is enough bytes in the chunk
    while (msgChunk.byteLength - offset >= this.BLOCK_SIZE) {
        // load block
        for (var i=0; i< this.BLOCK_SIZE; i++) {
            this.block8[i] = msgChunk8[offset + i];
        }
        offset += this.BLOCK_SIZE;
        // process block
        this.processBlock();
        this.totalMsgLengthInBytes += this.BLOCK_SIZE;
    }

    var lastBlockLength = msgChunk.byteLength - offset;
    if (lastBlockLength > 0) {
        this.lastBlock = new ArrayBuffer(lastBlockLength);
        this.lastBlock8 = new Int8Array(this.lastBlock);
        // here copy to lastBlock
        for (i = 0; i < lastBlockLength; i++) {
            this.lastBlock8[i] = msgChunk8[offset + i];
        }
    }
};


ChunkSha256.prototype._writeTotalMessageSize = function () {
    var totalMsgLengthInBits = this.totalMsgLengthInBytes * 8;
    var hex = totalMsgLengthInBits.toString(16);
    // pad the hex string so it is 16 characters long
    while(hex.length < 16) {
        hex = '0'+ hex;
    }

    this.block8[56] = parseInt(hex.substring(0, 2), 16);
    this.block8[57] = parseInt(hex.substring(2, 4), 16);
    this.block8[58] = parseInt(hex.substring(4, 6), 16);
    this.block8[59] = parseInt(hex.substring(6, 8), 16);

    this.block8[60] = parseInt(hex.substring(8, 10), 16);
    this.block8[61] = parseInt(hex.substring(10,12), 16);
    this.block8[62] = parseInt(hex.substring(12,14), 16);
    this.block8[63] = parseInt(hex.substring(14), 16);
};

ChunkSha256.prototype.get = function () {
    // examine last block
    if (!this.lastBlock) {
        // create 1 last padded block
        this.block = new ArrayBuffer(this.BLOCK_SIZE);
        this.block8 = new Int8Array(this.block);
        this.block32 = new Int32Array(this.block);
        // add 1
        this.block8[0] = -128;
        // add total msg size
        this._writeTotalMessageSize();
        this.processBlock();
    } else {
        // there is a lastBlock
        // add 1
        this.block = new ArrayBuffer(this.BLOCK_SIZE);
        this.block8 = new Int8Array(this.block);
        this.block32 = new Int32Array(this.block);

        this.totalMsgLengthInBytes += this.lastBlock.byteLength;
        this.block8.set(this.lastBlock8);
        this.block8[this.lastBlock.byteLength] = -128;

        if (this.lastBlock.byteLength <= this.BLOCK_SIZE - 8 - 1) {
            // length will fit
            // we do not need to pad as it was initialized with zeros
            this._writeTotalMessageSize();
            this.processBlock();

        } else {
            // length will NOT
            // fit we have to pad 0 till the end and create one more block
            // we do not need to pad as it was initialized with zeros
            this.processBlock();
            // create 1 extra block
            this.block = new ArrayBuffer(this.BLOCK_SIZE);
            this.block8 = new Int8Array(this.block);
            this.block32 = new Int32Array(this.block);
            this._writeTotalMessageSize();
            this.processBlock();
        }
    }

    this.done = true;
    return this.h_ab;
};

ChunkSha256.prototype.getHex = function () {
    var self = this;

    var hex = function (arrayBuffer) {
        // if little-endian flip bytes to big-endian
        if (self.endianness === "little endian") {
            var view = new DataView(arrayBuffer);
            for (var i = 0; i < arrayBuffer.byteLength; i = i + 4) {
                view.setInt32(i, view.getInt32(i, true));
            }
        }

        var i, x, hex_tab = '0123456789abcdef', res = [], binarray = new Uint8Array(arrayBuffer);
        for (i = 0; i < binarray.length; i++) {
            x = binarray[i];
            res[i] = hex_tab.charAt(x >> 4 & 15) + hex_tab.charAt(x >> 0 & 15);
        }
        return res.join('');
    };
    if (this.done === true) {
        return hex(this.h_ab);
    } else {
        return hex(this.get());
    }
};


function readAsync(chunkSha, file, n, chunkSize, totalParts, startTime, callback) {
    var start = n * chunkSize;
    var end = start + chunkSize;
    if (n === totalParts - 1) {
        end = file.size;
    }
    var blob = file.slice(start, end);

    var reader = new FileReader();
    reader.onload = function(e) {
        chunkSha.update(e.target.result);
        callback({name: 'progress', data: end/file.size*100});
        if (n === totalParts - 1) {
            var stopTime = new Date().getTime();
            callback({name: 'hash', data: chunkSha.getHex()});
            callback({name: 'totalTime', data: ((stopTime - startTime)/1000)});
            return;
        }
        readAsync(chunkSha, file, n+1, chunkSize, totalParts, startTime, callback);
    };
    reader.readAsArrayBuffer(blob);
}

function readSync(chunkSha, file, n, chunkSize, totalParts, startTime, callback) {
    var start = n * chunkSize;
    var end = start + chunkSize;
    if (n === totalParts - 1) {
        end = file.size;
    }
    var blob = file.slice(start, end);

    var reader = new FileReaderSync();
    chunkSha.update(reader.readAsArrayBuffer(blob));
    callback({name: 'progress', data: end/file.size*100});
    if (n === totalParts - 1) {
        var stopTime = new Date().getTime();
        callback({name: 'hash', data: chunkSha.getHex()});
        callback({name: 'totalTime', data: ((stopTime - startTime)/1000)});
    }
}

function handleFile (file, callback) {
    var start = new Date().getTime();
    var chunkSize = 1 * 1024 * 1024;
    var chunkSha = new ChunkSha();
    var totalParts = Math.ceil(file.size/chunkSize);
    if (typeof FileReaderSync !== 'undefined') {
        // loop
        // Aug 2016 - Chrome, Firefox, Safari, Opera
        callback({name: 'filereader', data: 'sync'});
        for (var n = 0; n < totalParts; n++) {
            readSync(chunkSha, file, n, chunkSize, totalParts, start, callback);
        }
    } else {
        callback({name: 'filereader', data: 'async'});
        // recursion
        // TODO: as our worker async algorithm is recursive
        // to make sure we would not cross the stack call limit
        // lets increase the chunk size to make sure that the totalParts
        readAsync(chunkSha, file, 0, chunkSize, totalParts, start, callback);
    }
}

this.onmessage = function onMessage(e) {
    handleFile(e.data, function (e) {
        postMessage(e);
    });
}


//=========================================================
if (typeof module !== 'undefined') {
    module.exports = ChunkSha256;
} else if(window !== undefined) {
    window.ChunkSha256 = ChunkSha256;
}

// here we have to check as for the worker window is not available
})(typeof window !== 'undefined' ? window : undefined);
