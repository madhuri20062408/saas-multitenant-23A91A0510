const bcrypt = require('bcryptjs');

async function hash(pwd) {
  const hashed = await bcrypt.hash(pwd, 10);
  console.log(pwd, '=>', hashed);
}

(async () => {
  await hash('Password123!'); // for alice@acme.com
  await hash('User123!');     // for user1@acme.com
  await hash('Demo123!');     // for admin@demo.com
  await hash('DemoUser123!'); // for user1@demo.com
})();
