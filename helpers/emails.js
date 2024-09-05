import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
    });

    const {email, nombre, token} = datos;

    //Enviar el email
    await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Confirmacion de cuenta',
        text: 'Confrima tu cuenta en BienesRaices.com',
        html: `
            <p>Hola ${nombre}, confirma tu cuenta en bienesraices.com</p>

            <p>Confirmala en el siguiente enlace:
                <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar Cuenta</a>
            </p>

            <p>Si tu no creaste esta cuenta, ignora el email</p>
        `
    })
}

const emailOlvidePassword = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
    });

    const {email, nombre, token} = datos;

    //Enviar el email
    await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Recuperar contraseña',
        text: 'Recupera tu contraseña de BienesRaices.com',
        html: `
            <p>Hola ${nombre}, recupera tu contraseña de bienesraices.com</p>

            <p>Confirmala en el siguiente enlace:
                <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Recuperar contraseña</a>
            </p>

            <p>Si tu no solicitaste recuperar tu contraseña, ignora el email</p>
        `
    })
}


export{
    emailRegistro,
    emailOlvidePassword
}