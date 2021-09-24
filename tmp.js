let offspringdirs = await Promise.all(
    fs.readdirSync(thedir, { withFileTypes: true }) // get an Array of Dirend objects with entry (a file or a dir) names and type
        .filter(x => x.isDirectory()) // filter (selete) the directories
        .map(async (x) => (thedir + '/' + x.name.replace(/\\/g, '/')))
).then(async (d) => {
    // d is like [subdir1, subdir2, ...]
    // console.log(32, d)
    // the above is to idenify a list of subdirs (the dirs of the immediate children of the input 'thedir' )
    // next is to loop for each subdir and get their children dirs (grandchildren dirs of the input 'thedir')
    let grandsubdirs_arrx = await Promise.all(
        d.map(async (x) => (await get_offspringdirs(x)))
    ).then(async (e) => {
        // e is like [[grandsubdir0], [grandsubdir1, grandsubdir2], [grandsubdir3], ...]
        // the first layer of [] is for each subdir (d)
        // the second layer is for grandsubdirs  under each individual subdir
        // console.log(e)
        let grandsubdirs_arr = e.reduce((a, b) => { return a.concat(b) }, [])
        // the reduce function is like 'merging' (it is called concatenation, i.e., concat). 
        // in the above, it starts from a initialvalue []. 
        // This initial array becomes the first 'previous value' or 'a', 
        // the reduce function then read the first element of e is an array,
        // (i.e., the second layer array [grandsubdir0]) as the 'current value' or 'b'
        // according to the algorithm defined above 'a.concat(b)', the reduce function concat the two arrays
        // the reduce function then move to the second element in e
        // now the previous value or a is [grandsubdir0], and the current is [grandsubdir1, grandsubdir2]
        // the concat is repeated, and then the reduce function moves to the third element...
        // The funciton is done when all elements in e have been gone through
        // Thus, the first lay arrays are all concat into one array and is returned

        // console.log(57, grandsubdirs_arr)
        return grandsubdirs_arr
    })//  let arrs = await Promise.all(

    return d.concat(grandsubdirs_arrx)

}) //let childrendirs_arr = await Promise.all(