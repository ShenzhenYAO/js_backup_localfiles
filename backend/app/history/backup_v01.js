const fs = require("fs");
const configfile = 'data/config/config.json'
const backuplogfile = 'data/log/backuplog.json';
const rootdir_src = "C:\\Users\\Z70\\Desktop\\src1";
const rootdir_target = 'C:\\Users\\Z70\\Desktop\\target1';

const beautify = require('beautify');

(async () => {

    // back up files from multiple src directories to multiple target directories
    let backuplog_json = { files: {}, subdirs: {} }

    // read the src and target directories from the config file
    let configstr = fs.readFileSync(configfile)
    let config_json = JSON.parse(configstr)
    for (let i = 7; i < config_json.length; i++) {
        let thetask = config_json[i]
        console.log(thetask)

        let thetasklog_json = await backup_a_src_dir(thetask.src, thetask.target)
        backuplog_json.files = { ...backuplog_json.files, ...thetasklog_json.files }
        backuplog_json.subdirs = { ...backuplog_json.subdirs, ...thetasklog_json.subdirs }
    } //for (let i=0; i < config_json.length; i++)

    // write the updated src_dict as the backuplog
    let thetxtjson = JSON.stringify(backuplog_json)
    // console.log(thetxtjson)
    let thetxtjson_beautified = beautify(thetxtjson, { format: 'json' })
    // do not use the saveJSON function as that one saves a JSON (not jsonstr) to a .json file
    await fs.writeFileSync(backuplogfile, thetxtjson_beautified)

})()


// a function to backup local files according to src and target dir
async function backup_a_src_dir(rootdir_src, rootdir_target) {

    let rootdir_src_norm = rootdir_src.replace(/\\/g, '/')
    // console.log(rootdir_src_norm)
    let rootdir_target_norm = rootdir_target.replace(/\\/g, '/')
    // console.log(rootdir_target_norm)

    // get all files and subdirs from the src
    let src_dict = await get_files_subdirs(rootdir_src_norm)
    // console.log(src_dict)

    // initially, the files and subdirs in the backup target folder should be read into the backup log
    let dict_target = await get_files_subdirs(rootdir_target_norm)
    // console.log(18, dict_target)

    // loop for all filese in the src
    let keys_srcfiles = Object.keys(src_dict.files)
    for (let i = 0; i < keys_srcfiles.length; i++) {

        // check whether the file can be found in the target dict
        let thesrcfilename_withpath = keys_srcfiles[i]

        // get the stats of the src file
        let stats_srcfile = fs.statSync(thesrcfilename_withpath)

        // the src file name with path is like <roodir_src>/subdir/srcfile.ext
        // the corresponding file in the target dir is with the same subdir and file name, but different rootdir
        // like <roodir_target>/subdir/srcfile.ext
        // therefore, to have the target file name with path, the roodir must be substitated using the rooddir_target
        let thetargetfilename_withpath = thesrcfilename_withpath.replace(rootdir_src_norm, rootdir_target_norm)
        // console.log(31, thesrcfilename_withpath, thetargetfilename_withpath)

        src_dict.files[thesrcfilename_withpath].srcrootdir = rootdir_src_norm
        src_dict.files[thesrcfilename_withpath].targetrootdir = rootdir_target_norm
        if (dict_target.files[thetargetfilename_withpath]) { // if the file (corresponding to the src file) can be found in the target_dict
            // get the stats of the target file
            let stats_targetfile = fs.statSync(thetargetfilename_withpath)
            let size_changed = stats_srcfile.size === stats_targetfile.size
            let srcfile_is_newer = stats_srcfile.mtime.getTime() > stats_targetfile.mtime.getTime()
            // console.log(43, 'size changed, src file is newer:', size_changed, srcfile_is_newer)
            if (size_changed && srcfile_is_newer) { // if the src file is newer, overwrite the old file in the target folder
                // using the src file to overwrite the target file
                // console.log(45, 'file changed')
                await fs.copyFileSync(thesrcfilename_withpath, thetargetfilename_withpath)
                src_dict.files[thesrcfilename_withpath].backupstatus = 'updated'

            } else {
                // in the source dict, indicate that the same file (same size, same modified time) exists
                src_dict.files[thesrcfilename_withpath].backupstatus = 'unchanged'
            } // if (size_changed && srcfile_is_newer)
        } else { // if the correponding file cannot be found in the target path, copy the source file to the target
            // hold on, what if the src file's dir does not exist in the target path?
            // copyFileSync is stupid enough and won't create the non-existing dir!

            // get the directory of the source file
            let fullpath_srcfile = src_dict.files[thesrcfilename_withpath].fullpath
            // console.log(56, fullpath_srcfile) 
            let fullpath_targetfile = fullpath_srcfile.replace(rootdir_src_norm, rootdir_target_norm)
            // console.log(58, fullpath_targetfile) 

            // in ms windows, it is not allowed to create C:/Users/Z70/Desktop/target1/sub_1
            // while its parent folder C:/Users/Z70/Desktop/target1 does not exist
            // therefore, need to check whether the parent folder exists, like
            // if C:/Users does not exist, create it first, next, if C:/Users/Z70 does not exist, create it...
            let dirExist = await fs.existsSync(fullpath_targetfile)
            if (dirExist === false) {
                await make_dir(fullpath_targetfile)
            } // if (dirExist === false)                            

            await fs.copyFileSync(thesrcfilename_withpath, thetargetfilename_withpath)
            src_dict.files[thesrcfilename_withpath].backupstatus = 'created'

        } // if (target_dict[thesrcfilename_withpath])
    } // for (let i=0; i<keys_srcfiles.length; i++)

    return src_dict

}; // async function backup_a_src_dir(rootdir_src,rootdir_target )

//in ms windows, it is not allowed to create C:/Users/Z70/Desktop/target1/sub_1
// while its parent folder C:/Users/Z70/Desktop/target1 does not exist
// therefore, need to check whether the parent folder exists, like
// if C:/Users does not exist, create it first, next, if C:/Users/Z70 does not exist, create it...
async function make_dir(thedir) {
    let thepath = ''
    let pathsegs = thedir.split('/')
    for (let i = 0; i < pathsegs.length; i++) {
        if (i === 0) { theseg = pathsegs[i] } else { theseg = '/' + pathsegs[i] }
        thepath = thepath + theseg
        let dirExist = await fs.existsSync(thepath)
        // console.log(72, thepath,dirExist)
        if (dirExist === false) { await fs.mkdirSync(thepath) }
    } // for (let i =0; i< pathsegs.length; i++)                
}; // async function make_dir  

// recursively get the files and subdirs within a given rootdir, save the size and last modified info
async function get_files_subdirs(thedir) {
    let result_dict = { files: {}, subdirs: {} }
    let dirExist = await fs.existsSync(thedir)
    if (dirExist) {
        let names_arr = await fs.readdirSync(thedir)
        // loop for each name (of a file or a subdir) in the dir
        for (let i = 0; i < names_arr.length; i++) {
            let thename = names_arr[i]
            let thename_with_path = thedir + '/' + thename
            // get the stat of the current file/dir
            let thestat = await fs.statSync(thename_with_path)
            if (thestat.isFile()) {
                // console.log(29, thename_with_path)
                result_dict.files[thename_with_path] = {}
                result_dict.files[thename_with_path].filename = thename
                result_dict.files[thename_with_path].fullpath = thedir
                result_dict.files[thename_with_path].size = thestat.size
                result_dict.files[thename_with_path].mtime = thestat.mtime
            } else {// if it is a directory
                result_dict.subdirs[thename_with_path] = {}
                result_dict.subdirs[thename_with_path].mtime = thestat.mtime
                let thedir_subdir = thename_with_path
                let result_subdir_dict = await get_files_subdirs(thedir_subdir)

                // for the fields files and dirs respectively, merg the data in result_subdir_dict into result_subdir
                result_dict.files = { ...result_dict.files, ...result_subdir_dict.files }
                result_dict.subdirs = { ...result_dict.subdirs, ...result_subdir_dict.subdirs }
            } // if lese (isFile) 
        } // for (let i = 0; i < names_arr.length; i++)
    }//if (dirExist)

    return result_dict
};//async function get_files_subdirs



