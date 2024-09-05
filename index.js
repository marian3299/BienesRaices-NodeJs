import express from 'express' //ECMAScript Module
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRotes.js'
import db from './config/db.js'

//Crear la app
const app = express();

//Habilitar lectura de datos de formularios
app.use( express.urlencoded({extended:true}) )

//Habilitar Cookie Parser
app.use( cookieParser() )

//Habilitar CSRF
app.use( csrf({cookie: true}))

//Conexion a la base de datos
try {
    await db.authenticate();
    db.sync();
    console.log('Conexion exitosa a la base de datos')
} catch (error) {
    console.log(error);
}

//Habilitar Pug
app.set('view engine', 'pug') //Especificamos el view engine que vamos a utilizar
app.set('views', './views') //Indicamos en que ruta se van a encotrar las vistas

//Carpeta publica 
app.use( express.static('public') ) // <--- nuestro elementos estaticos van a estar en la carpeta public

//Routing
app.use('/auth', usuarioRoutes)


//Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000; 
app.listen(port, () => {
    console.log(`El servidor esta funcionando en el puerto ${port}`);
})