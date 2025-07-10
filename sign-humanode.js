const fs = require('fs');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');

const MNEMONIC_FILE = 'mnemonics.txt';
const USERNAME_FILE = 'usernames.txt';
const OUTPUT_FILE = 'signed_messages.txt';

async function main() {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });

  const mnemonics = fs.readFileSync(MNEMONIC_FILE, 'utf-8').trim().split('\n');
  const usernames = fs.readFileSync(USERNAME_FILE, 'utf-8').trim().split('\n');

  if (mnemonics.length !== usernames.length) {
    console.error('❌ Mnemonics ve usernames sayısı eşleşmiyor!');
    process.exit(1);
  }

  let output = '';

  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i].trim();
    const username = usernames[i].trim();
    try {
      const pair = keyring.addFromUri(mnemonic);
      const address = pair.address;
      const message = `I associate my Discord account activity ${username} with my Humanode Mainnet validator address`;
      const signature = '0x' + Buffer.from(pair.sign(message)).toString('hex');

      output += `Mnemonic: ${mnemonic}\n`;
      output += `Discord: ${username}\n`;
      output += `Address: ${address}\n`;
      output += `Message: ${message}\n`;
      output += `Signature: ${signature}\n`;
      output += `------------------------\n`;
    } catch (err) {
      output += `Mnemonic: ${mnemonic}\n`;
      output += `❌ ERROR: ${err.message}\n`;
      output += `------------------------\n`;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ İşlem tamam! Sonuçlar "${OUTPUT_FILE}" dosyasına yazıldı.`);
}

main();
