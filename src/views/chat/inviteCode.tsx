<Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
  <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
    <DialogPanel>
      <DialogTitle>提示</DialogTitle>
      <Description>请输入邀请码</Description>
      <Input placeholder="请输入邀请码" />
      <Button onClick={() => setIsOpen(false)}>确定</Button>
    </DialogPanel>
  </div>
</Dialog>;
