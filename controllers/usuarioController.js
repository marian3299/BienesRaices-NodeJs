import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { generarJWT, generarId } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'
import Usuario from '../models/Usuario.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesion',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    //Validacion de usuario y password
    await check('email').isEmail().withMessage('El email es obligatorio').run(req);
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req);

    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            errores: resultado.array(), 
            csrfToken: req.csrfToken()
        })
    }

    //Comprobar si el usuario existe 
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            errores: [{msg: 'El usuario no existe'}], 
            csrfToken: req.csrfToken()
        })
    }

    //Comprobar si el usuario esta confirmado
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            errores: [{msg: 'Favor de confirmar su cuenta'}], 
            csrfToken: req.csrfToken()
        })
    }

    //Verificar password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesion',
            errores: [{msg: 'Password incorrecto'}], 
            csrfToken: req.csrfToken()
        })
    }

    //Autenticar usuario
    const token = generarJWT(usuario.id);

    console.log(token);
}

const formularioRegistro = (req, res) => {

    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) => {
    //Validacion 
    await check('nombre').notEmpty().withMessage('Nombre obligatorio').run(req);
    await check('email').isEmail().withMessage('Email invalido').run(req);
    await check('password').isLength({ min: 6 }).withMessage('El password debe de tener minimo 6 caracteres').run(req);
    await check('repetir_password').equals(req.body.password).withMessage('Los passwords no son iguales').run(req);

    let resultado = validationResult(req);

    //Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            errores: resultado.array(), //Mandamos los errores a la vista
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,

            }
        })
    }

    //Extraer datos
    const { nombre, email, password } = req.body;

    //Verificar que el usuario no este duplicado 
    const exsiteUsuario = await Usuario.findOne({ where: { email } });

    if (exsiteUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            errores: [{ msg: 'El usuario ya esta registrado' }],
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: nombre,
                email: email
            }
        })
    }

    //Almacenar usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //Envia email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmacion
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un email de confirmacion, por favor confirma tu cuenta'
    })
}

//Funcion que confirma la cuenta
const confirmar = async (req, res) => {

    const { token } = req.params;

    //Verificar si token es valido
    const usuario = await Usuario.findOne({ where: { token } })
    console.log(usuario)

    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al crear tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intente de nuevo',
            error: true
        })
    }

    //Confirmar la cuenta
    usuario.token = null; //Eliminamos el token del usuario
    usuario.confirmado = true; //Cambiamos el estado del usuario
    await usuario.save(); //Guardamos los cambios en la bdd

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmo correctamente'
    });

}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken(),
    })
}

const resetPassword = async (req, res) => {
    //Verificar el email
    await check('email').isEmail().withMessage('Email invalido').run(req);

    let resultado = validationResult(req);

    //Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            errores: resultado.array(), //Mandamos los errores a la vista
            csrfToken: req.csrfToken(),
        })
    }

    //Buscar al usuario
    const { email } = req.body

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            errores: [{ msg: "El email no pertenece a nigun usuario" }], //Mandamos los errores a la vista
            csrfToken: req.csrfToken(),
        })
    }

    //Generar un token y enviar el email
    usuario.token = generarId();
    await usuario.save();

    //Enviar email
    emailOlvidePassword({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmacion
    res.render('templates/mensaje', {
        pagina: 'Restablece tu password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    })
}


const comprobarToken = async (req, res) => {
    const { token } = req.params;

    const usuario = await Usuario.findOne({ where: { token } });

    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al validar tu informacion, intente de nuevo',
            error: true
        })
    }

    //Mostrar form para agregar password
    res.render('auth/reset-password', {
        pagina: 'Reestablece tu password',
        csrfToken: req.csrfToken()

    })
}

const nuevoPassword = async (req, res) => {
    //Validar el password
    await check('password').isLength({ min: 6 }).withMessage('El password debe de tener minimo 6 caracteres').run(req);

    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu password',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,

            }
        })
    }

    //Identificar al usuario
    const { token } = req.params
    const { password } = req.body

    const usuario = await Usuario.findOne({ where: { token } });

    //Hashear el nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();

    //Renderizamos la vista
    res.render('auth/confirmar-cuenta', {
        pagina: 'Password reestablecido',
        mensaje: 'El password se guardo correctamente'
    });
}

export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}