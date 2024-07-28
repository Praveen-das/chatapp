const settings = {
    hidden: {
        opacity: 0,
        transition: {
            duration: 0.1,
        }
    },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.1,
        }
    }
}

const profilDetails = {
    hidden: {
        width: '0%',
        marginRight: '-16px'
    },
    visible: {
        width: 'calc(100%/3)',
        marginRight: '0'
    },

}

export default {
    settings,
    profilDetails
}