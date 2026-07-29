let sqlJsPromise = null;

export function getSqlJs() {
    if (!sqlJsPromise) {
        sqlJsPromise = window.initSqlJs({ locateFile: (file) => './js/vendor/sql.js/' + file });
    }
    return sqlJsPromise;
}
