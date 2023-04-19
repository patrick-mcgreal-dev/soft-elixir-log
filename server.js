const exp = require('express');
const app = exp();
const port = 3001;

app.use(exp.static('./dist', { extensions: 'html' }));

app.listen(port, () => {

    console.log(`Listening on port ${port}`);

});