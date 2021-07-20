

## go编译的可执行文件添加图标

go 在windows下编译出来的可执行文件是没有图标的。

使用 [akavel/rsrc: Tool for embedding .ico & manifest resources in Go programs for Windows. (github.com)](https://github.com/akavel/rsrc)

可以加上

1. 添加配置文件，ico.manifase 文件

   ```xml
   <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
   <assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
   <assemblyIdentity
       version="1.0.0.0"
       processorArchitecture="x86"
       name="controls"
       type="win32"
   ></assemblyIdentity>
   <dependency>
       <dependentAssembly>
           <assemblyIdentity
               type="win32"
               name="Microsoft.Windows.Common-Controls"
               version="6.0.0.0"
               processorArchitecture="*"
               publicKeyToken="6595b64144ccf1df"
               language="*"
           ></assemblyIdentity>
       </dependentAssembly>
   </dependency>
   </assembly>
   ```
 2. 生成图标配置文件
 > rsrc.exe  -manifest ico.manifest -ico rc.ico  main.syso

3. 将 `main.syso`  文件放到 main.go 文件路径下面
   go build 出来的exe 文件自动就会有图标了。

4. ubuntu 系统下增加图标

   [Ubuntu 中如何给 GoLand 设置桌面快捷图标_WU2629409421perfect的博客-CSDN博客](https://blog.csdn.net/wu2629409421perfect/article/details/106234727)

## go 压缩

默认使用`go build` ，编译出来的一个可执行文件体积有 `7M` 多。压缩可执行文件，减少磁盘占用空间，是一个桌面软件的最求之一。

 1. 编译增加参数

go build -ldflags "-s -w" 

其中  -ldflags 里的  -s 去掉符号信息， -w 去掉DWARF调试信息，得到的程序就不能用gdb调试了。

 此时得到的文件体积有`5M`多



2. 压缩加壳工具
   https://github.com/upx/upx   免安装

> upx.exe -9  hostsSwitchHelper.exe

  `-9` 最大压缩

此时得到的文件体积只有 `1M` 多了，amazing！



