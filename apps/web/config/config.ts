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
            duration: 0.10,
        }
    }
}

const profilDetails = {
    hidden: {
        width: '0%',
        marginLeft: '-1rem'
    },
    visible: {
        width: '100%',
        marginLeft: '0'
    },

}

const PAGINATION_LIMIT = 50

export default {
    settings,
    profilDetails,
    PAGINATION_LIMIT
}