package main

import (
	"encoding/json"
	"fmt"
	"github.com/robfig/cron/v3"
	log "github.com/sirupsen/logrus"
	"hostsSwitchHelper/lib"
	"io"
	"io/ioutil"
	"mime"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func main() {
	//配置日志输出到console,同时写文件
	writer1 := os.Stdout
	writer2, _ := os.OpenFile(lib.GetRealPath("run.log"), os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0755)
	log.SetFormatter(&log.JSONFormatter{})
	log.SetOutput(io.MultiWriter(writer1, writer2))
	log.SetLevel(log.DebugLevel)
	// 添加定时任务, 每30执行一次
	crontab := cron.New()
	crontab.AddFunc("@every 30m", handlerTask)
	crontab.Start()

	//静态文件服务器
	//添加文件类型，windows下测试，默认js文件响应的header：content-type不正确，会报错：Service Worker registration error: Unsupported MIME type ('text/plain')
	mime.AddExtensionType(".js", "application/javascript")
	fs := http.FileServer(http.Dir("ui/"))
	http.Handle("/", http.StripPrefix("/", fs))
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
	err := open("http://" + url)
	if err != nil{
		fmt.Println("打开浏览器失败，请手动复制网址打开：" + err.Error())
	}
	http.ListenAndServe(url, nil)

}

// 定时更新http连接的内容
func handlerTask() {
	configs := lib.ReadConfig()
	for i := 0; i < len(configs); i++ {
		if strings.Contains(configs[i].IP,"http") {
			client := &http.Client{}
			resp, err := client.Get(configs[i].IP)
			if err != nil{
				log.Error("获取http配置错误" + err.Error())
			}
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil{
				log.Error("读取配置错误" + err.Error())
			}
			configs[i].Hosts = string(body)
			lib.UpdateConfig(configs[i])
		}
	}
}
/**
  读取配置接口
*/
func getConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	result,_ := json.Marshal(lib.ReadConfig())
	if string(result) == "null" {
		result = []byte("[]")
	}
	w.Write(result)
}
//获取系统hosts
func getHosts (w http.ResponseWriter, r *http.Request)  {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Write(lib.ReadHosts())
}
//删除hosts
func delConfig(w http.ResponseWriter, r *http.Request)  {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	r.ParseForm()
	id := r.Form["id"]
	lib.DelConfig(id[0])
	w.Write([]byte("ok"))
}
//添加配置
func addConfig(w http.ResponseWriter, r *http.Request)  {
	editConfig(w,r,"add")
}
//修改配置
func updateConfig(w http.ResponseWriter, r *http.Request)  {
	editConfig(w,r,"update")
}
// 新增或修改
func editConfig(w http.ResponseWriter, r *http.Request, method string)  {
	w.Header().Set("Access-Control-Allow-Origin", "*")             //允许访问所有域
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
	if method == "add"{
		err = lib.AddConfig(config)
	}else{
		err = lib.UpdateConfig(config)
	}

	if err != nil {
		w.Write([]byte(err.Error()))
	}
	w.Write([]byte("ok"))
}
// 浏览器打开网址
func open(uri string) error {
	var commands = map[string]string{
		"windows": "start",
		"darwin":  "open",
		"linux":   "xdg-open",
	}
	run, ok := commands[runtime.GOOS]
	if !ok {
		return fmt.Errorf("don't know how to open things on %s platform", runtime.GOOS)
	}
	if run=="start" {
		return exec.Command(`cmd`, `/c`, `start`, uri).Start()
	}else{
		return exec.Command(run, uri).Start()
	}
}
