package lib

import (
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type Config struct {
	Id     string `json:"id"`
	Hosts  string `json:"hosts"`
	Name   string `json:"name"`
	Status string `json:"status"`
	IP     string `json:"ip,omitempty"`
}

//读取配置
func ReadConfig() []Config {
	var config []Config
	//初始化配置
	filePtr, err := os.Open(GetRealPath("config.json"))
	if err != nil {
		log.Error("读取配置文件 config.json 失败:" + err.Error())
		return nil
	}
	defer filePtr.Close()
	//json
	decoder := json.NewDecoder(filePtr)
	err = decoder.Decode(&config)
	if err != nil {
		log.Error("config.json 解码失败:" + err.Error())
		return nil
	}
	return config
}

//读取系统配置
func ReadHosts() []byte {
	hostsPath := GetHostsPath()
	content, err := os.ReadFile(hostsPath)
	if err != nil {
		log.Error("读取hosts失败:" + hostsPath + "|" + err.Error())
		return nil
	}
	return content
}

// DelConfig 删除配置
func DelConfig(id string) error {
	config := ReadConfig()
	for i, s := range config {
		if s.Id == id {
			config = append(config[:i], config[i+1:]...)
		}
	}
	return saveConfig(config)
}

// AddConfig 添加配置
func AddConfig(config Config) error {
	configs := ReadConfig()
	configs = append(configs, config)
	return saveConfig(configs)
}

// UpdateConfig 更新配置
func UpdateConfig(config Config) error {
	configs := ReadConfig()
	for i, s := range configs {
		if s.Id == config.Id {
			configs[i] = config
		}
	}
	return saveConfig(configs)
}

// GetHostsPath 获取hosts路径
func GetHostsPath() string {
	dir := "/etc/hosts"
	if runtime.GOOS == "windows" {
		dir = os.Getenv("windir")
		dir = filepath.Join(dir, "system32", "drivers", "etc", "hosts")
	}
	return dir
}

// GetRealPath 获取配置文件的真实路径，文件在当前文件夹下存在，则返回，不存在则使用当前exe绝对路径
func GetRealPath(fileName string) string {
	_, err := os.Stat("./" + fileName)
	if err == nil {
		return "./" + fileName
	}
	file, _ := exec.LookPath(os.Args[0])
	path, _ := filepath.Abs(file)
	return filepath.Dir(path) + string(os.PathSeparator) + fileName
}

//保存配置
func saveConfig(configs []Config) error {
	//修改系统hosts 文件
	hosts := "";
	for i := 0; i < len(configs); i++ {
		if configs[i].Status == "on" {
			hosts += configs[i].Hosts + "\n"
		}
	}
	ioutil.WriteFile(GetHostsPath(),[]byte(hosts), 0644)
	//修改配置文件
	filePtr, err := os.OpenFile(GetRealPath("config.json"), os.O_WRONLY|os.O_TRUNC|os.O_CREATE, 0644)
	if err != nil {
		log.Error("读取配置文件 config.json 失败:" + err.Error())
	}
	defer filePtr.Close()
	encoder := json.NewEncoder(filePtr)
	return encoder.Encode(configs)
}
