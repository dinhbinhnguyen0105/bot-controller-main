const checkUidStatus = (uid) => {
    return new Promise((resolve, reject) => {
        fetch(`https://graph.facebook.com/${uid}/picture?redirect=false`)
            .then(res => res.json())
            .then(res => {
                if (res?.data?.height) resolve(true)
                else resolve(false);
            })
            .catch(err => reject(false));
    });
}

module.exports = { checkUidStatus };
