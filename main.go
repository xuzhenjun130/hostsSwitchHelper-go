package main

import (
	"embed"
	"encoding/json"
	"fmt"
	log "github.com/sirupsen/logrus"
	webview "github.com/webview/webview_go"
	"hostsSwitchHelper/lib"
	"io"
	"io/fs"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"runtime"
)

//go:embed ui/*
var ui embed.FS

func main() {
	if runtime.GOOS != "windows" {
		fmt.Println("修改hosts文件需要sudo密码，请输入:")
		var sudoPwd string
		for {
			if _, err := fmt.Scanf("%s", &sudoPwd); err != nil {
				fmt.Printf("%s\n", err)
				return
			}
			cmd := "echo '" + sudoPwd + "' | sudo -S ls"
			_, err := exec.Command("bash", "-c", cmd).Output()
			if err != nil {
				fmt.Printf("sudo密码不正确，请重新输入.\n")
			}
			lib.SetPwd(sudoPwd)
			break
		}
	}

	//配置日志输出到console,同时写文件
	writer1 := os.Stdout
	writer2, _ := os.OpenFile(lib.GetRealPath("run.log"), os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0755)
	log.SetFormatter(&log.JSONFormatter{})
	log.SetOutput(io.MultiWriter(writer1, writer2))
	log.SetLevel(log.DebugLevel)

	//静态文件服务器
	uiDir, err := fs.Sub(ui, "ui")
	if err != nil {
		log.Fatal(err)
	}
	fileService := http.FileServer(http.FS(uiDir))
	http.Handle("/", http.StripPrefix("/", fileService))
	//获取配置
	http.HandleFunc("/getConfig", getConfig)
	//获取系统hosts
	http.HandleFunc("/getHosts", getHosts)
	//删除
	http.HandleFunc("/delConfig", delConfig)
	//新增
	http.HandleFunc("/addConfig", addConfig)
	//更新
	http.HandleFunc("/updateConfig", updateConfig)
	url := "127.0.0.1:8011"
	fmt.Println("程序已经启动，浏览器自动打开网址：" + url)
	go func() {
		err = http.ListenAndServe(url, nil)
		if err != nil {
			fmt.Println("服务启动失败：" + err.Error())
		}
	}()
	w := webview.New(false)
	defer w.Destroy()
	w.SetTitle("Hosts切换助手")
	w.SetSize(1024, 800, webview.HintNone)
	//w.Navigate("http://localhost:8000")
	w.Navigate("http://" + url)
	w.Run()

}

/*
*

	读取配置接口
*/
func getConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	result, _ := json.Marshal(lib.ReadConfig())
	if string(result) == "null" {
		result = []byte("[]")
	}
	w.Write(result)
}

// 获取系统hosts
func getHosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write(lib.ReadHosts())
}

// 删除hosts
func delConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	r.ParseForm()
	id := r.Form["id"]
	lib.DelConfig(id[0])
	w.Write([]byte("ok"))
}

// 添加配置
func addConfig(w http.ResponseWriter, r *http.Request) {
	editConfig(w, r, "add")
}

// 修改配置
func updateConfig(w http.ResponseWriter, r *http.Request) {
	editConfig(w, r, "update")
}

// 新增或修改
func editConfig(w http.ResponseWriter, r *http.Request, method string) {
	w.Header().Set("Access-Control-Allow-Origin", "*") //允许访问所有域
	if r.Method == "OPTIONS" {
		w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Add("Access-Control-Allow-Methods", "GET, POST")
		w.Write([]byte("ok"))
		return
	}
	defer r.Body.Close()

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Fatal("read request error")
	}
	var config lib.Config
	err = json.Unmarshal(body, &config)
	if err != nil {
		log.Fatal("json.Unmarshal request error")
	}
	if method == "add" {
		err = lib.AddConfig(config)
	} else {
		err = lib.UpdateConfig(config)
	}

	if err != nil {
		w.Write([]byte(err.Error()))
	}
	w.Write([]byte("ok"))
}
