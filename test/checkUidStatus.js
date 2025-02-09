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

// def run(self, ):
// uids = FileHandler.get_file_names_of_data("account")
// for uid in uids:
//     status = None
//     res = requests.get(f'https://graph.facebook.com/{uid}/picture?redirect=false')
//     if res.status_code == 200:
//         data = res.json()
//         if data.get("data"):
//             data = data.get("data")
//             if data.get("width"): status = "live"
//             else: status = "checkpoint"
//         else:
//             status = "checkpoint"
//     else: status = "undefined"
//     AccountHandler.edit({
//         "uid": uid,
//         "status": status
//     })
//     self.progress.emit()
// self.finished.emit()
